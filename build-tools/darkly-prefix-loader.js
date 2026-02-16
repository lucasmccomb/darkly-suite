/**
 * @darkly/build-tools — CSS Prefix Loader
 *
 * Webpack loader that rewrites generic `.darkly-` prefixed CSS tokens to the
 * product-specific prefix supplied via loader options.
 *
 * Transforms:
 *   .darkly-settings-toggle  →  .{prefix}-settings-toggle
 *   --darkly-accent-color    →  --{prefix}-accent-color
 *   data-darkly-active       →  data-{prefix}-active
 *
 * Usage in webpack config:
 *   {
 *     loader: require.resolve('./darkly-prefix-loader'),
 *     options: { prefix: 'gd' }   // or 'sd', 'dd', 'ds'
 *   }
 */

/** @type {import('webpack').LoaderDefinitionFunction} */
module.exports = function darklyPrefixLoader(source) {
  const options = this.getOptions();
  const prefix = options && options.prefix;

  if (!prefix) {
    this.emitError(
      new Error(
        'darkly-prefix-loader: "prefix" option is required (e.g. { prefix: "gd" })'
      )
    );
    return source;
  }

  // 1. CSS class names:  .darkly-  →  .{prefix}-
  let result = source.replace(/\.darkly-/g, `.${prefix}-`);

  // 2. CSS custom properties:  --darkly-  →  --{prefix}-
  result = result.replace(/--darkly-/g, `--${prefix}-`);

  // 3. Data attributes:  data-darkly-  →  data-{prefix}-
  result = result.replace(/data-darkly-/g, `data-${prefix}-`);

  return result;
};
