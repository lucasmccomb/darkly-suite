const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const PREFIX = 'sd';

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
    content: './src/content.ts',
    background: './src/background.ts',
    offscreen: './src/offscreen.ts',
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
      '@darkly/site-sheets': path.resolve(__dirname, '../site-sheets/src'),
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
        // Sheets-specific override CSS from @darkly/site-sheets
        // with darkly- → sd- prefix transformation
        {
          from: path.resolve(__dirname, '../site-sheets/src/styles/sheets-overrides.css'),
          to: 'styles/sheets-overrides.css',
          transform: transformPrefix,
        },
        // Shared core CSS files (themes, settings-panel)
        // with darkly- → sd- prefix transformation
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
        { from: 'src/offscreen.html', to: 'offscreen.html' },
      ],
    }),
  ],
};
