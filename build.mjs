import * as esbuild from 'esbuild';
import * as fs from 'fs';
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

// Build JS
await esbuild.build({
  ...options,
  minify: true,
  sourcemap: true,
});

// Update ServiceWorker version so cache busts on deploy
let swContent = fs.readFileSync('dist/ServiceWorker.js', 'utf8');
swContent = swContent.replace(/const VERSION = \d+/, `const VERSION = ${Date.now()}`);
fs.writeFileSync('dist/ServiceWorker.js', swContent);

console.log('Build complete!');
