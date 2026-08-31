export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TIME_SLOTS = [
  { label: '7:00-9:00 AM', start: '07:00', end: '09:00' },
  { label: '9:00-11:00 AM', start: '09:00', end: '11:00' },
  { label: '11:00 AM-1:00 PM', start: '11:00', end: '13:00' },
  { label: '1:00-3:00 PM', start: '13:00', end: '15:00' },
  { label: '3:00-5:00 PM', start: '15:00', end: '17:00' },
];

export function currentDayName() {
  return DAYS[new Date().getDay() - 1] ?? null;
}

export function currentTimeHHMM() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}
