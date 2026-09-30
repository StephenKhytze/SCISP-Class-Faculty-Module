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

export const BOOKING_STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  declined: 'Declined',
  completed: 'Completed',
};

export const BOOKING_STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  declined: 'bg-rose-50 text-rose-700 border-rose-200',
  completed: 'bg-sky-50 text-sky-700 border-sky-200',
};

export const BOOKING_CHIP_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  declined: 'bg-rose-100 text-rose-800',
  completed: 'bg-sky-100 text-sky-800',
};

export const LEAVE_STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

export const LEAVE_STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  declined: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

export function formatLeaveRange(start, end) {
  const fmt = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return start === end ? fmt(start) : `${fmt(start)} – ${fmt(end)}`;
}

export function leaveDayCount(start, end) {
  return Math.round((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000) + 1;
}
