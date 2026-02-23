const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const PREFIX = 'dd';

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
      '@darkly/site-docs': path.resolve(__dirname, '../site-docs/src'),
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
        // Docs-specific override CSS from @darkly/site-docs
        // with darkly- → dd- prefix transformation
        {
          from: path.resolve(__dirname, '../site-docs/src/styles/docs-overrides.css'),
          to: 'styles/docs-overrides.css',
          transform: transformPrefix,
        },
        // Shared core CSS files (themes, settings-panel)
        // with darkly- → dd- prefix transformation
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
