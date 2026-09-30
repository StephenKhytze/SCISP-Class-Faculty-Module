export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Class Schedule only: College/Masteral (weekend/evening programs) can run Sunday classes,
// unlike everything else that shares DAYS (Basic Ed, faculty booking grids, etc.), so this
// stays a separate list instead of adding Sunday to DAYS itself.
export const SCHEDULE_DAYS = [...DAYS, 'Sunday'];

export const EDUCATION_LEVELS = ['Basic Ed', 'College', 'Masteral'];

export const YEAR_LEVEL_OPTIONS = {
  College: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
  Masteral: ['1st Year', '2nd Year'],
};

export const BASIC_ED_YEAR_GROUPS = {
  Elementary: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
  'Junior High School': ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
  'Senior High School': ['Grade 11', 'Grade 12'],
};

export const SENIOR_HIGH_GRADES = BASIC_ED_YEAR_GROUPS['Senior High School'];

export const STRANDS = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL', 'Arts and Design', 'Sports'];

export function isSeniorHigh(year) {
  return SENIOR_HIGH_GRADES.includes(year);
}

// One-hour blocks, 7 AM - 5 PM. A class longer than an hour spans several of these
// consecutively; the grid merges them into one visual cell (see slotsSpannedBy below)
// instead of repeating the class in every block it touches.
function hourLabel(h) {
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${period}`;
}

export const TIME_SLOTS = Array.from({ length: 10 }, (_, i) => {
  const startHour = 7 + i;
  const endHour = startHour + 1;
  const start = `${String(startHour).padStart(2, '0')}:00`;
  const end = `${String(endHour).padStart(2, '0')}:00`;
  return { label: `${hourLabel(startHour)} - ${hourLabel(endHour)}`, start, end };
});

// How many consecutive 1-hour TIME_SLOTS a class occupies, starting at the slot whose
// `start` equals the class's start_time. Used as the <td rowSpan> for that cell so a
// 2-hour class renders as one merged block instead of two separate ones.
export function slotsSpannedBy(entry) {
  const startIdx = TIME_SLOTS.findIndex((slot) => slot.start === entry.start_time);
  if (startIdx === -1) return 1;
  let count = 0;
  for (let i = startIdx; i < TIME_SLOTS.length && TIME_SLOTS[i].start < entry.end_time; i++) count++;
  return Math.max(count, 1);
}

export function currentDayName() {
  return DAYS[new Date().getDay() - 1] ?? null;
}

export function currentTimeHHMM() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function compactHour(hhmm) {
  const h = parseInt(hhmm.split(':')[0], 10);
  return String(h % 12 === 0 ? 12 : h % 12);
}
