const { merge } = require('webpack-merge');
const webpack = require('webpack');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  // hidden-source-map, not source-map: maps are still written to dist/ for local
  // debugging, but the shipped JS carries no sourceMappingURL comment. The
  // packaging script strips *.map from the store zip, so a plain 'source-map'
  // would leave every bundle pointing at a file that is not in the upload.
  devtool: 'hidden-source-map',
  plugins: [
    new webpack.DefinePlugin({
      __DEV_MODE__: JSON.stringify(false),
      __PRODUCT_ID__: JSON.stringify('browse'),
    }),
  ],
});
