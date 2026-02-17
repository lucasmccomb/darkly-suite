import React from 'react';
import type { ScheduleConfig as ScheduleConfigType } from '../storage/types';
import { TimeRangePicker } from './shared/TimeRangePicker';
import { usePrefix } from '../context';

interface ScheduleConfigProps {
  schedule: ScheduleConfigType;
  onScheduleChange: (schedule: ScheduleConfigType) => void;
}

export function ScheduleConfig({
  schedule,
  onScheduleChange,
}: ScheduleConfigProps) {
  const p = usePrefix();

  return (
    <div className={`${p}-settings-subsection`}>
      <h3 className={`${p}-settings-section-title`}>Schedule</h3>
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
      />
    </div>
  );
}
