import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { usePrefix } from '../../context';

interface CollapsibleSectionProps {
  title: string;
  active: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({ title, active, children }: CollapsibleSectionProps) {
  const p = usePrefix();
  const [collapsed, setCollapsed] = useState(!active);

  // Auto-expand/collapse when active state changes
  useEffect(() => {
    setCollapsed(!active);
  }, [active]);

  return (
    <div className={`${p}-settings-section ${!active ? `${p}-settings-section--disabled` : ''}`}>
      <button
        type="button"
        className={`${p}-settings-section-header`}
        onClick={() => setCollapsed((c) => !c)}
      >
        <ChevronRight
          size={12}
          className={`${p}-settings-chevron ${collapsed ? '' : `${p}-settings-chevron--open`}`}
        />
        <h3 className={`${p}-settings-section-title`}>
          {title}
          <span className={`${p}-settings-status-label ${active ? `${p}-settings-status-label--active` : `${p}-settings-status-label--inactive`}`}>
            {active ? 'Active' : 'Inactive'}
          </span>
        </h3>
      </button>
      {!collapsed && children}
    </div>
  );
}
