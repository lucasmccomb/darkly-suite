import React from 'react';
import type { ScheduleConfig as ScheduleConfigType } from '../storage/types';
import { CollapsibleSection } from './shared/CollapsibleSection';
import { TimeRangePicker } from './shared/TimeRangePicker';
import { usePrefix } from '../context';

interface ScheduleConfigProps {
  active: boolean;
  schedule: ScheduleConfigType;
  onScheduleChange: (schedule: ScheduleConfigType) => void;
  /** When true, render without CollapsibleSection wrapper (for ModeDetailPanel) */
  inline?: boolean;
}

export function ScheduleConfig({
  active,
  schedule,
  onScheduleChange,
  inline,
}: ScheduleConfigProps) {
  const p = usePrefix();

  const content = (
    <div className={`${p}-settings-subsection`}>
      <p className={`${p}-settings-hint`}>Dark mode will be active between these hours.</p>
      <TimeRangePicker
        startHour={schedule.startHour}
        endHour={schedule.endHour}
        onStartChange={(startHour) =>
          onScheduleChange({ ...schedule, startHour })
        }
        onEndChange={(endHour) =>
          onScheduleChange({ ...schedule, endHour })
        }
        disabled={!active}
      />
    </div>
  );

  if (inline) return content;

  return (
    <CollapsibleSection title="Schedule" active={active}>
      {content}
    </CollapsibleSection>
  );
}
