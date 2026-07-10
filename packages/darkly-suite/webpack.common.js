const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { ThirdPartyLicensesPlugin } = require('../../build-tools/collect-licenses');

const PREFIX = 'ds';

// Transform generic 'darkly-' prefix in CSS to the product-specific prefix.
// Matches the same replacements as build-tools/darkly-prefix-loader.js.
function transformPrefix(content) {
  return content
    .toString()
    .replace(/\.darkly-/g, `.${PREFIX}-`)
    .replace(/--darkly-/g, `--${PREFIX}-`)
    .replace(/data-darkly-/g, `data-${PREFIX}-`);
}

module.exports = {
  entry: {
    'content-gmail': './src/content-gmail.ts',
    'content-sheets': './src/content-sheets.ts',
    'content-docs': './src/content-docs.ts',
    'content-drive': './src/content-drive.ts',
    background: './src/background.ts',
    offscreen: './src/offscreen.ts',
    pageWorld: './src/pageWorld.ts',
    'landing-bridge': path.resolve(__dirname, '../core/src/landing-bridge.ts'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            compilerOptions: { noEmit: false },
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@darkly/core': path.resolve(__dirname, '../core/src'),
      '@darkly/site-gmail': path.resolve(__dirname, '../site-gmail/src'),
      '@darkly/site-sheets': path.resolve(__dirname, '../site-sheets/src'),
      '@darkly/site-docs': path.resolve(__dirname, '../site-docs/src'),
      '@darkly/site-drive': path.resolve(__dirname, '../site-drive/src'),
    },
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'static', to: '.' },
        // Shared brand icons from @darkly/core
        { from: path.resolve(__dirname, '../core/static/icons'), to: 'icons' },
        // Shared core CSS files with darkly- → ds- prefix transformation
        {
          from: path.resolve(__dirname, '../core/src/styles/themes.css'),
          to: 'styles/themes.css',
          transform: transformPrefix,
        },
        {
          from: path.resolve(__dirname, '../core/src/styles/settings-panel.css'),
          to: 'styles/settings-panel.css',
          transform: transformPrefix,
        },
        // Site-specific override CSS with darkly- → ds- prefix transformation
        {
          from: path.resolve(__dirname, '../site-gmail/src/styles/gmail-overrides.css'),
          to: 'styles/gmail-overrides.css',
          transform: transformPrefix,
        },
        {
          from: path.resolve(__dirname, '../site-sheets/src/styles/sheets-overrides.css'),
          to: 'styles/sheets-overrides.css',
          transform: transformPrefix,
        },
        {
          from: path.resolve(__dirname, '../site-docs/src/styles/docs-overrides.css'),
          to: 'styles/docs-overrides.css',
          transform: transformPrefix,
        },
        {
          from: path.resolve(__dirname, '../site-drive/src/styles/drive-overrides.css'),
          to: 'styles/drive-overrides.css',
          transform: transformPrefix,
        },
        { from: 'src/offscreen.html', to: 'offscreen.html' },
      ],
    }),
    // Emit THIRD-PARTY-LICENSES.txt with the license texts of all bundled
    // production dependencies (#671).
    new ThirdPartyLicensesPlugin(__dirname),
  ],
};
