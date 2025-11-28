const http = require('http');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, 'public');
const port = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function serveStaticFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const safePath = req.url.split('?')[0];
  if (safePath === '/env.js') {
    const env = {
      SUPABASE_URL: process.env.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || ''
    };
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(`window.__ENV__ = ${JSON.stringify(env)};`);
    return;
  }

  const requestPath = safePath === '/' ? '/index.html' : safePath;
  const filePath = path.join(publicDir, requestPath);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    serveStaticFile(filePath, res);
  });
});

server.listen(port, () => {
  console.log(`MYFLOW pronto su http://localhost:${port}`);
});
