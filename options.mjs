export default {
  entryPoints: ['src/js/index.js'],
  bundle: true,
  format: 'esm',
  outdir: 'dist',
  loader: {
    '.ttl': 'text',
  },
  external: [],
};
