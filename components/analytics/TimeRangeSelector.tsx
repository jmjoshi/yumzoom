'use client';

import { TimeRange } from '@/types/analytics';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'year', label: 'Last Year' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="time-range" className="text-sm font-medium text-gray-700">
        Time Range:
      </label>
      <select
        id="time-range"
        value={value}
        onChange={(e) => onChange(e.target.value as TimeRange)}
        className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
      >
        {timeRanges.map((range) => (
          <option key={range.value} value={range.value}>
            {range.label}
          </option>
        ))}
      </select>
    </div>
  );
}
