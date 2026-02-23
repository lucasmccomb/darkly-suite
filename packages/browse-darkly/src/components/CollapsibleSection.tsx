import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const styles = {
  section: {
    borderBottom: '1px solid #44446a',
  },
  header: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: 8,
    padding: '12px 16px',
    cursor: 'pointer',
    background: 'none',
    borderWidth: 0,
    borderStyle: 'none' as const,
    borderColor: 'transparent',
    width: '100%',
    textAlign: 'left' as const,
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: 600 as const,
    fontFamily: 'inherit',
  },
  chevron: {
    transition: 'transform 0.2s',
    color: '#888',
    flexShrink: 0,
  },
  content: {
    padding: '0 16px 16px',
  },
};

export function CollapsibleSection({ title, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={styles.section}>
      <button
        type="button"
        style={styles.header}
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronRight
          size={14}
          style={{
            ...styles.chevron,
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
        {title}
      </button>
      {open && <div style={styles.content}>{children}</div>}
    </div>
  );
}
