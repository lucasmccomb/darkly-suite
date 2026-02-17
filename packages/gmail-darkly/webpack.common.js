const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const PREFIX = 'gd';

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
    pageWorld: './src/pageWorld.ts',
    background: './src/background.ts',
    offscreen: './src/offscreen.ts',
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
        // Gmail-specific override CSS from @darkly/site-gmail
        // with darkly- → gd- prefix transformation
        {
          from: path.resolve(__dirname, '../site-gmail/src/styles/gmail-overrides.css'),
          to: 'styles/gmail-overrides.css',
          transform: transformPrefix,
        },
        // Shared core CSS files (themes, night-tint, settings-panel)
        // with darkly- → gd- prefix transformation
        {
          from: path.resolve(__dirname, '../core/src/styles/themes.css'),
          to: 'styles/themes.css',
          transform: transformPrefix,
        },
        {
          from: path.resolve(__dirname, '../core/src/styles/night-tint.css'),
          to: 'styles/night-tint.css',
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
