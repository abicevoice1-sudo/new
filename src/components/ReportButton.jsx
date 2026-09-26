import { useState } from 'react';
import { ReportFlag } from './ReportFlag';

export function ReportButton({ targetType, targetId, label = 'Report' }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs hover:underline" style={{ color: 'var(--color-ink-faint)' }}>
        {label}
      </button>
    );
  }
  return <ReportFlag targetType={targetType} targetId={targetId} onDone={() => setOpen(false)} />;
}
