export const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SHORT_TO_FULL_DAY = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export function to24Hour(hour, minute, meridiem) {
  let h = parseInt(hour, 10) % 12;
  if (/pm/i.test(meridiem)) h += 12;
  return `${String(h).padStart(2, '0')}:${minute}`;
}

export function to12Hour(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function parseOfficeHours(text) {
  if (!text) return { days: [], start: '', end: '' };
  const days = DAY_OPTIONS.filter((d) => new RegExp(`\\b${d}\\b`, 'i').test(text));
  const match = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return { days, start: '', end: '' };
  return {
    days,
    start: to24Hour(match[1], match[2], match[3]),
    end: to24Hour(match[4], match[5], match[6]),
  };
}

export function formatOfficeHours(days, start, end) {
  if (days.length === 0 || !start || !end) return '';
  const dayLabel = days.length === 1 ? days[0] : `${days.slice(0, -1).join(', ')} & ${days[days.length - 1]}`;
  return `${dayLabel} ${to12Hour(start)} - ${to12Hour(end)}`;
}

export function parseOfficeHoursFullDays(text) {
  const parsed = parseOfficeHours(text);
  return { ...parsed, days: parsed.days.map((d) => SHORT_TO_FULL_DAY[d]) };
}
