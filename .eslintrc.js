module.exports = {
  root: true,
  extends: ['expo', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      // Build tooling runs in Node, not in the app runtime: Buffer/process are
      // globals here, and printing to the terminal is the point.
      files: ['scripts/**'],
      env: { node: true, browser: false },
      rules: {
        'no-console': 'off',
      },
    },
    {
      // The service worker runs in its own global scope — no window, no DOM.
      files: ['public/sw.js'],
      env: { serviceworker: true, browser: true },
      rules: {
        'no-console': 'off',
        // BUILD_ID and PRECACHE are placeholder-substituted at build time.
        'no-undef': 'off',
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'src/content/'],
};
