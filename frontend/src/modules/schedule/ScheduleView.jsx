import { useEffect, useMemo, useState } from 'react';
import { Search, FileDown, Lightbulb, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import ScheduleCell from './components/ScheduleCell';
import InstructorProfileModal from './components/InstructorProfileModal';
import { DAYS, TIME_SLOTS, currentDayName, currentTimeHHMM } from './constants';

const EMPTY_FILTERS = {
  search: '',
  level: '',
  year: '',
  dayRange: 'weekdays',
};

export default function ScheduleView() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  useEffect(() => {
    api
      .get('/schedule')
      .then((res) => setSchedules(res.data))
      .catch(() => setError('Unable to load the class schedule.'))
      .finally(() => setLoading(false));
  }, []);

  const levels = useMemo(() => [...new Set(schedules.map((s) => s.level))].sort(), [schedules]);
  const years = useMemo(() => [...new Set(schedules.map((s) => s.year))].sort(), [schedules]);

  const schedulesWithConflicts = useMemo(() => {
    return schedules.map((entry) => {
      const hasConflict = schedules.some(
        (other) =>
          other.schedule_id !== entry.schedule_id &&
          other.room === entry.room &&
          other.day === entry.day &&
          entry.start_time < other.end_time &&
          entry.end_time > other.start_time
      );
      return { ...entry, hasConflict };
    });
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    return schedulesWithConflicts.filter((s) => {
      if (filters.level && s.level !== filters.level) return false;
      if (filters.year && s.year !== filters.year) return false;
      if (keyword) {
        const haystack = `${s.subject_code} ${s.subject_name} ${s.room}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      return true;
    });
  }, [schedulesWithConflicts, filters]);

  const visibleDays = filters.dayRange === 'weekdays' ? DAYS.slice(0, 5) : DAYS;

  const currentClass = useMemo(() => {
    const day = currentDayName();
    const time = currentTimeHHMM();
    if (!day) return null;
    return schedules.find((s) => s.day === day && s.start_time <= time && s.end_time > time) || null;
  }, [schedules]);

  const entriesFor = (day, slot) =>
    filteredSchedules.filter(
      (s) => s.day === day && s.start_time < slot.end && s.end_time > slot.start
    );

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Class Schedule & Timetable</h2>
          <p className="text-sm text-gray-500 mt-1">
            Weekly calendar timetable view, course & year level filtering, instructor profile popups, conflict detection.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#182848] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#0f1a33] transition-colors shrink-0"
        >
          <FileDown className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      {currentClass && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                Current Class Active
              </span>
              <p className="text-sm text-gray-800 mt-1">
                You currently have <span className="font-bold text-[#80172B]">{currentClass.subject_code}</span> in{' '}
                {currentClass.room}
              </p>
              <p className="text-xs text-gray-500">
                {currentClass.subject_name} | {currentClass.start_time} - {currentClass.end_time}
                {currentClass.faculty && <> | {currentClass.faculty.name}</>}
              </p>
            </div>
          </div>
          {currentClass.faculty && (
            <button
              onClick={() => setSelectedInstructor(currentClass.faculty)}
              className="flex items-center gap-1.5 bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors shrink-0"
            >
              Instructor Profile
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase">Search Subject / Room</label>
            <div className="relative mt-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Subject code, room..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
              />
            </div>
          </div>

          <FilterSelect label="Course" value={filters.level} onChange={(v) => setFilters((f) => ({ ...f, level: v }))} options={levels} allLabel="All Courses" />
          <FilterSelect label="Year Level" value={filters.year} onChange={(v) => setFilters((f) => ({ ...f, year: v }))} options={years} allLabel="All Year Levels" />

          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase">Filter Day</label>
            <select
              value={filters.dayRange}
              onChange={(e) => setFilters((f) => ({ ...f, dayRange: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
            >
              <option value="weekdays">Monday - Friday</option>
              <option value="all">Monday - Saturday</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading schedule...</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      {!loading && !error && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Weekly Timetable Calendar Grid</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-bold text-gray-500 uppercase p-3 w-32">Time</th>
                  {visibleDays.map((day) => (
                    <th key={day} className="text-left text-xs font-bold text-gray-500 uppercase p-3 min-w-[160px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot) => (
                  <tr key={slot.label} className="border-b border-gray-100 last:border-b-0">
                    <td className="p-3 text-xs font-bold text-gray-700 align-top">{slot.label}</td>
                    {visibleDays.map((day) => (
                      <td key={day} className="p-2 align-top border-l border-gray-100">
                        <ScheduleCell entries={entriesFor(day, slot)} onSelectInstructor={setSelectedInstructor} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InstructorProfileModal faculty={selectedInstructor} onClose={() => setSelectedInstructor(null)} />
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, allLabel }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-400 uppercase">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
      >
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
