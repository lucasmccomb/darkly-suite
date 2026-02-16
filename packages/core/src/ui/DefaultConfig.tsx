import React from 'react';
import { CollapsibleSection } from './shared/CollapsibleSection';
import { usePrefix } from '../context';

interface DefaultConfigProps {
  active: boolean;
}

export function DefaultConfig({ active }: DefaultConfigProps) {
  const p = usePrefix();

  return (
    <CollapsibleSection title="Default" active={active}>
      <p className={`${p}-settings-hint`}>
        The app will use whichever theme you&apos;ve chosen in its own
        settings. Darkly&apos;s dark theme will never be applied.
      </p>
    </CollapsibleSection>
  );
}
