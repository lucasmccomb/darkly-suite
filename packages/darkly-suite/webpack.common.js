const path = require('path');
const {
  createDarklyWebpackConfig,
} = require('@darkly/build-tools/webpack.factory');

module.exports = createDarklyWebpackConfig({
  prefix: 'ds',
  packageDir: __dirname,
  entry: {
    'content-gmail': './src/content-gmail.ts',
    'content-sheets': './src/content-sheets.ts',
    'content-docs': './src/content-docs.ts',
    'content-drive': './src/content-drive.ts',
    background: './src/background.ts',
  },
  alias: {
    '@darkly/core': path.resolve(__dirname, '../core/src'),
    '@darkly/site-gmail': path.resolve(__dirname, '../site-gmail/src'),
    '@darkly/site-sheets': path.resolve(__dirname, '../site-sheets/src'),
    '@darkly/site-docs': path.resolve(__dirname, '../site-docs/src'),
  },
});
