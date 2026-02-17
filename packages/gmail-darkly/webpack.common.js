const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

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
        {
          from: path.resolve(__dirname, '../site-gmail/src/styles'),
          to: 'styles',
        },
        { from: 'src/offscreen.html', to: 'offscreen.html' },
      ],
    }),
  ],
};
