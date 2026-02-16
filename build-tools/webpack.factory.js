/**
 * @darkly/build-tools — Shared Webpack Config Factory
 *
 * Creates a reusable webpack configuration for any Darkly extension.
 * Each extension calls `createDarklyWebpackConfig()` with its specific
 * options, then merges it with dev/prod settings via webpack-merge.
 *
 * Usage:
 *   const { createDarklyWebpackConfig } = require('@darkly/build-tools/webpack.factory');
 *   module.exports = createDarklyWebpackConfig({ prefix: 'gd', entry: { ... } });
 */

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

/**
 * @param {object} options
 * @param {string} options.prefix          - CSS prefix for this extension ('gd', 'sd', 'dd', 'ds')
 * @param {string} options.packageDir      - Absolute path to the extension's package directory
 * @param {Record<string, string>} options.entry - Webpack entry points
 * @param {Array<import('copy-webpack-plugin').ObjectPattern>} [options.copyPatterns] - Extra CopyPlugin patterns
 * @param {Record<string, string>} [options.alias] - Extra resolve aliases
 * @returns {import('webpack').Configuration}
 */
function createDarklyWebpackConfig(options) {
  const { prefix, packageDir, entry, copyPatterns = [], alias = {} } = options;

  // Default copy patterns: static/ → dist root, plus any extras
  const defaultCopyPatterns = [
    { from: path.resolve(packageDir, 'static'), to: '.' },
  ];

  return {
    entry,
    module: {
      rules: [
        // TypeScript
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
        // CSS with darkly prefix rewriting
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: require.resolve('./darkly-prefix-loader'),
              options: { prefix },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      symlinks: false,
      alias: {
        '@': path.resolve(packageDir, 'src'),
        ...alias,
      },
    },
    output: {
      filename: '[name].js',
      path: path.resolve(packageDir, 'dist'),
      clean: true,
    },
    plugins: [
      new CopyPlugin({
        patterns: [...defaultCopyPatterns, ...copyPatterns],
      }),
    ],
  };
}

module.exports = { createDarklyWebpackConfig };
