export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const EDUCATION_LEVELS = ['College', 'Masteral', 'Basic Ed'];

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

export function compactHour(hhmm) {
  const h = parseInt(hhmm.split(':')[0], 10);
  return String(h % 12 === 0 ? 12 : h % 12);
}
