import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as http from 'http';
import options from './options.mjs';

// Clean dist
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

// Copy static files
fs.copyFileSync('src/index.html', 'dist/index.html');
fs.copyFileSync('src/ServiceWorker.js', 'dist/ServiceWorker.js');
fs.cpSync('src/css', 'dist/css', { recursive: true });

// Watch for changes in static files
fs.watch('src', { recursive: true }, (eventType, filename) => {
  if (filename.endsWith('.html')) {
    fs.copyFileSync('src/index.html', 'dist/index.html');
  }
  if (filename === 'ServiceWorker.js') {
    fs.copyFileSync('src/ServiceWorker.js', 'dist/ServiceWorker.js');
  }
  if (filename.endsWith('.css')) {
    fs.cpSync('src/css', 'dist/css', { recursive: true });
  }
});

// Start esbuild with watch
const ctx = await esbuild.context({
  ...options,
  sourcemap: true,
});

await ctx.watch();

// Simple dev server
const server = http.createServer((req, res) => {
  let path = req.url === '/' ? '/index.html' : req.url;
  path = 'dist' + path.split('?')[0];
  
  const ext = path.split('.').pop();
  const contentTypes = {
    html: 'text/html',
    js: 'application/javascript',
    css: 'text/css',
    json: 'application/json',
    svg: 'image/svg+xml',
  };
  
  try {
    const content = fs.readFileSync(path);
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
  console.log('Watching for changes...');
});
