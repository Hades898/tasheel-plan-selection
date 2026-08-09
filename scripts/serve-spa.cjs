const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.ttf': 'font/ttf' };
http.createServer((req, res) => {
  let cleanPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (cleanPath.startsWith('/tasheel-bnpl-prototype/')) cleanPath = cleanPath.slice('/tasheel-bnpl-prototype'.length);
  if (cleanPath === '/tasheel-bnpl-prototype') cleanPath = '/';
  let filePath = path.resolve(root, cleanPath === '/' ? 'index.html' : `.${cleanPath}`);
  if (!filePath.startsWith(`${root}${path.sep}`) && filePath !== path.join(root, 'index.html')) {
    filePath = path.join(root, 'index.html');
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(root, 'index.html');
  }
  res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}).listen(4174, '127.0.0.1', () => console.log('SPA server http://127.0.0.1:4174'));
