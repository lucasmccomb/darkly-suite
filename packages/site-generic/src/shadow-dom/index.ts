// Shadow DOM support modules

export { setRootCustomProperties } from './css-var-inheritance';

export { ShadowStyleInjector } from './shadow-injector';

export { getShadowRoot, hasClosedShadowRootAccess } from './closed-root-access';

export { ShadowRootDiscovery } from './shadow-discovery';
export type { ShadowRootCallback } from './shadow-discovery';

export { LAYER_ORDER, wrapInLayer, buildLayeredCSS } from './css-layers';

export { ShadowPerfOptimizer } from './performance';
export type { ShadowPerfOptions } from './performance';
