export const STATUS_LABELS = {
  available: 'Available',
  in_class: 'In Class',
  off_campus: 'Off Campus',
  consultation_hours: 'Consultation Hours',
  on_leave: 'On Leave',
};

export const STATUS_STYLES = {
  available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  in_class: 'bg-rose-50 text-rose-700 border-rose-200',
  off_campus: 'bg-slate-100 text-slate-600 border-slate-200',
  consultation_hours: 'bg-amber-50 text-amber-700 border-amber-200',
  on_leave: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const STATUS_DOT = {
  available: 'bg-emerald-500',
  in_class: 'bg-rose-500',
  off_campus: 'bg-slate-400',
  consultation_hours: 'bg-amber-500',
  on_leave: 'bg-slate-400',
};

export function statusLabel(status, detail) {
  const base = STATUS_LABELS[status] || status;
  return detail ? `${base} (${detail})` : base;
}
