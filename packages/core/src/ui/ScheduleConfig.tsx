import React from 'react';
import type { ScheduleConfig as ScheduleConfigType } from '../storage/types';
import { CollapsibleSection } from './shared/CollapsibleSection';
import { TimeRangePicker } from './shared/TimeRangePicker';
import { usePrefix } from '../context';

interface ScheduleConfigProps {
  active: boolean;
  schedule: ScheduleConfigType;
  onScheduleChange: (schedule: ScheduleConfigType) => void;
}

export function ScheduleConfig({
  active,
  schedule,
  onScheduleChange,
}: ScheduleConfigProps) {
  const p = usePrefix();

  return (
    <CollapsibleSection title="Schedule" active={active}>
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
    </CollapsibleSection>
  );
}
