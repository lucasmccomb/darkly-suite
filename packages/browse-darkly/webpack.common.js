const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const PREFIX = 'bd';

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
    popup: './src/popup.tsx',
    sidepanel: './src/sidepanel.tsx',
    'page-world': './src/page-world.ts',
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
      '@darkly/site-generic': path.resolve(__dirname, '../site-generic/src'),
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
        // Shared core CSS files (themes, settings-panel)
        // with darkly- → bd- prefix transformation
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
      ],
    }),
    new HtmlWebpackPlugin({
      template: './src/popup.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: './src/sidepanel.html',
      filename: 'sidepanel.html',
      chunks: ['sidepanel'],
    }),
  ],
};
