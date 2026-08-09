#!/usr/bin/env python3
"""Golden Figma preflight checker.

Fails fast when a Figma-to-code project is missing source/spec/assets/evidence,
or when code appears to replace Figma assets with AI/generic approximations.
Stdlib-only, intentionally conservative. Waive explicitly in VALIDATION.md if needed.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

VISUAL_EXTS = {".tsx", ".ts", ".jsx", ".js", ".css", ".scss", ".html"}
SKIP_DIRS = {"node_modules", ".git", "dist", "build", ".expo", ".next", "coverage", "ios", "android"}
TIER_ORDER = {"T0": 0, "T1": 1, "T2": 2, "T3": 3, "T4": 4}

INLINE_SVG_RE = re.compile(r"<Svg\b|<svg\b|react-native-svg|from ['\"]react-native-svg['\"]")
RAW_HEX_RE = re.compile(r"#[0-9a-fA-F]{3,8}\b")
GENERIC_ICON_RE = re.compile(r"from ['\"](?:lucide-react|@expo/vector-icons|react-icons|@fortawesome|phosphor-react|@phosphor-icons|@tabler/icons)")
RIYAL_GLYPH_RE = re.compile(r"[﷼﷼]")
AI_GENERIC_WORDS_RE = re.compile(r"\b(?:Lorem ipsum|Acme|Nexus|SmartFlow|Cloudly|Jane Doe|John Doe)\b", re.I)


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        return None, str(e)


def iter_code_files(project: Path):
    for root, dirs, files in os.walk(project):
        rootp = Path(root)
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
        for f in files:
            p = rootp / f
            if p.suffix in VISUAL_EXTS:
                yield p


def rel(project: Path, p: Path) -> str:
    try:
        return str(p.relative_to(project))
    except Exception:
        return str(p)


def add(findings, level, msg, path=None):
    findings.append({"level": level, "message": msg, "path": path})


def main() -> int:
    ap = argparse.ArgumentParser(description="Check Golden Figma workflow readiness")
    ap.add_argument("--project", default=".", help="Project path")
    ap.add_argument("--tier", default=None, choices=sorted(TIER_ORDER), help="Override tier")
    ap.add_argument("--slug", default=None, help="Task slug under artifacts/<slug>")
    ap.add_argument("--json", action="store_true", help="JSON output")
    ap.add_argument("--warn-only", action="store_true", help="Do not exit non-zero")
    args = ap.parse_args()

    project = Path(args.project).expanduser().resolve()
    findings = []

    policy_path = project / ".figma-policy.json"
    if not policy_path.exists():
        add(findings, "P0", "Missing .figma-policy.json. Run figma_golden_bootstrap.py first.", rel(project, policy_path))
        policy = {}
    else:
        loaded = load_json(policy_path)
        if isinstance(loaded, tuple):
            add(findings, "P0", f"Invalid .figma-policy.json: {loaded[1]}", rel(project, policy_path))
            policy = {}
        else:
            policy = loaded

    tier = args.tier or policy.get("tier") or "T2"
    tier_n = TIER_ORDER.get(tier, 2)
    slug = args.slug or Path(policy.get("taskArtifactRoot", "artifacts/figma-task")).name or "figma-task"

    required_all = [
        "figma/source-map.md",
        "figma/specs/design-system.json",
        "figma/assets/asset-manifest.json",
    ]
    if tier_n >= 2:
        required_all.extend([
            f"figma/specs/screens/{slug}.json",
            f"artifacts/{slug}/VALIDATION.md",
        ])
    for r in required_all:
        p = project / r
        if not p.exists():
            add(findings, "P0" if tier_n >= 2 else "P1", f"Missing required artifact for {tier}: {r}", r)
        elif p.stat().st_size < 20:
            add(findings, "P1", f"Artifact exists but looks empty: {r}", r)

    # Source map must have actual source pointers for T2+.
    source_map = project / "figma/source-map.md"
    if source_map.exists() and tier_n >= 2:
        text = source_map.read_text(encoding="utf-8", errors="ignore")
        if "TODO" in text:
            add(findings, "P1", "source-map.md still contains TODOs; source capture may be incomplete.", rel(project, source_map))
        if "Figma URL:" in text and re.search(r"Figma URL:\s*(TODO)?\s*$", text, re.M):
            add(findings, "P0", "source-map.md lacks Figma URL for T2+ work.", rel(project, source_map))

    # Design system and specs should not be empty for T2+.
    ds_path = project / "figma/specs/design-system.json"
    if ds_path.exists() and tier_n >= 2:
        loaded = load_json(ds_path)
        if not isinstance(loaded, tuple):
            tokens = loaded.get("tokens", {}) if isinstance(loaded, dict) else {}
            if not any(tokens.get(k) for k in tokens if isinstance(tokens, dict)):
                add(findings, "P1", "design-system.json has no populated tokens; implementation may invent design values.", rel(project, ds_path))
        else:
            add(findings, "P0", f"Invalid design-system.json: {loaded[1]}", rel(project, ds_path))

    manifest_path = project / "figma/assets/asset-manifest.json"
    manifest_assets = []
    if manifest_path.exists():
        loaded = load_json(manifest_path)
        if isinstance(loaded, tuple):
            add(findings, "P0", f"Invalid asset-manifest.json: {loaded[1]}", rel(project, manifest_path))
        elif isinstance(loaded, dict):
            manifest_assets = loaded.get("assets", []) or []
            if tier_n >= 2 and not manifest_assets:
                add(findings, "P1", "asset-manifest.json has zero assets. If Figma has custom/brand assets, this is a P0 until exported or waived.", rel(project, manifest_path))

    if tier_n >= 2:
        spec_path = project / f"figma/specs/screens/{slug}.json"
        if spec_path.exists():
            loaded = load_json(spec_path)
            if isinstance(loaded, tuple):
                add(findings, "P0", f"Invalid screen spec JSON: {loaded[1]}", rel(project, spec_path))
            elif isinstance(loaded, dict):
                nodes = loaded.get("nodes", [])
                if not nodes:
                    add(findings, "P0", "Screen spec has no critical nodes. T2+ requires critical-node spec coverage.", rel(project, spec_path))
                missing_testids = [n.get("name") or n.get("id") for n in nodes if isinstance(n, dict) and not n.get("testId")]
                if missing_testids:
                    add(findings, "P1", f"Spec nodes missing testID mappings: {missing_testids[:10]}", rel(project, spec_path))

    # Scan source for risky patterns.
    for p in iter_code_files(project):
        r = rel(project, p)
        if r.startswith("docs/figma-golden/") or r.startswith("artifacts/") or r.startswith("figma/"):
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        if INLINE_SVG_RE.search(text):
            add(findings, "P0", "Inline/custom SVG or react-native-svg detected. Verify every custom Figma vector is exported/manifested, not redrawn.", r)
        if GENERIC_ICON_RE.search(text):
            add(findings, "P1", "Generic icon library import detected. Must be explicitly mapped to Figma/Code Connect or waived.", r)
        if RIYAL_GLYPH_RE.search(text):
            add(findings, "P0", "Raw Riyal/currency glyph detected. Use Figma source asset if the design provides one.", r)
        if AI_GENERIC_WORDS_RE.search(text):
            add(findings, "P2", "Generic AI placeholder text/name detected.", r)
        # Raw hex is P1 unless in obvious token/theme files.
        if RAW_HEX_RE.search(text) and not re.search(r"(theme|token|design-system|tailwind|colors?)", r, re.I):
            add(findings, "P1", "Raw hex color outside token/theme file detected. Map to Figma/project token or rawFigmaValue.", r)

    validation = project / f"artifacts/{slug}/VALIDATION.md"
    if validation.exists() and tier_n >= 2:
        v = validation.read_text(encoding="utf-8", errors="ignore")
        for section in ["## Source", "## Assets", "## Checks", "## Screenshots", "## Verdict"]:
            if section not in v:
                add(findings, "P1", f"VALIDATION.md missing section {section}", rel(project, validation))
        if re.search(r"Pass/fail:\s*$", v, re.M) or "Pass / Pass with waivers / Fail" in v:
            add(findings, "P1", "VALIDATION.md verdict appears incomplete.", rel(project, validation))

    # Summarize.
    order = {"P0": 0, "P1": 1, "P2": 2}
    findings.sort(key=lambda x: (order.get(x["level"], 9), x.get("path") or "", x["message"]))
    verdict = "PASS"
    if any(f["level"] == "P0" for f in findings):
        verdict = "BLOCKED"
    elif any(f["level"] == "P1" for f in findings):
        verdict = "PASS_WITH_MAJOR_GAPS"

    result = {"project": str(project), "tier": tier, "slug": slug, "verdict": verdict, "findings": findings}
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"Golden Figma preflight: {verdict} ({tier}, slug={slug})")
        if not findings:
            print("No findings.")
        for f in findings:
            loc = f" [{f['path']}]" if f.get("path") else ""
            print(f"{f['level']}: {f['message']}{loc}")

    if args.warn_only:
        return 0
    return 1 if verdict == "BLOCKED" else 0


if __name__ == "__main__":
    raise SystemExit(main())
