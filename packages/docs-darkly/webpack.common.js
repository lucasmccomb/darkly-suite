const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    content: './src/content.ts',
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
    // Required for pnpm workspace symlinks
    symlinks: false,
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
        {
          from: path.resolve(__dirname, '../site-docs/src/styles'),
          to: 'styles',
        },
        { from: 'src/offscreen.html', to: 'offscreen.html' },
      ],
    }),
  ],
};
