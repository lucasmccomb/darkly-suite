import React, { createContext, useContext } from 'react';
import type { ProductConfig } from './config';

const DarklyContext = createContext<ProductConfig | null>(null);

export function DarklyProvider({ config, children }: { config: ProductConfig; children: React.ReactNode }) {
  return <DarklyContext.Provider value={config}>{children}</DarklyContext.Provider>;
}

export function usePrefix(): string {
  const config = useContext(DarklyContext);
  if (!config) throw new Error('usePrefix must be used within DarklyProvider');
  return config.prefix;
}

export function useDarklyConfig(): ProductConfig {
  const config = useContext(DarklyContext);
  if (!config) throw new Error('useDarklyConfig must be used within DarklyProvider');
  return config;
}
