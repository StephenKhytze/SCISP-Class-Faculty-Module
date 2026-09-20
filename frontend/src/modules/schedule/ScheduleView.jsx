import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, FileDown, Lightbulb, ArrowRight, ArrowLeft, UserCheck, BookOpen, Plus, Bell, Archive, ArchiveRestore } from 'lucide-react';
import api from '../../services/api';
import ScheduleCell from './components/ScheduleCell';
import InstructorProfileModal from './components/InstructorProfileModal';
import ClassDetailModal from './components/ClassDetailModal';
import ScheduleEditModal from './components/ScheduleEditModal';
import { DAYS, TIME_SLOTS, currentDayName, currentTimeHHMM } from './constants';

const EMPTY_FILTERS = {
  search: '',
  level: '',
  year: '',
  facultyId: '',
  dayRange: 'weekdays',
};

function compactHour(hhmm) {
  const h = parseInt(hhmm.split(':')[0], 10);
  return String(h % 12 === 0 ? 12 : h % 12);
}

export default function ScheduleView() {
  const [schedules, setSchedules] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedClassEntry, setSelectedClassEntry] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [viewingArchived, setViewingArchived] = useState(false);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  }, []);
  const isStudent = currentUser?.role === 'Student';
  const isAdmin = currentUser?.role === 'Admin';
  const isFaculty = currentUser?.role === 'Teacher';

  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState(() =>
    isStudent
      ? { ...EMPTY_FILTERS, level: currentUser?.level || '', year: currentUser?.year || '' }
      : EMPTY_FILTERS
  );

  const [screen, setScreen] = useState('landing');
  const [category, setCategory] = useState(null); // 'class' | 'teacher' | null
  const [pendingCourse, setPendingCourse] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get('/schedule', { params: viewingArchived ? { archived: 1 } : undefined })
      .then((res) => setSchedules(res.data))
      .catch(() => setError('Unable to load the class schedule.'))
      .finally(() => setLoading(false));
  }, [viewingArchived]);

  useEffect(() => {
    if (isStudent) return;
    api.get('/faculty').then((res) => setFaculties(res.data)).catch(() => setFaculties([]));
  }, [isStudent]);

  useEffect(() => {
    if (!isFaculty) return;
    api
      .get('/faculty/me')
      .then((res) => {
        setFilters({ ...EMPTY_FILTERS, facultyId: res.data.faculty_id });
        setCategory('teacher');
        setScreen('grid');
      })
      .catch(() => setError('No faculty profile is linked to your account yet.'));
  }, [isFaculty]);

  useEffect(() => {
    const deepLinkFacultyId = searchParams.get('facultyId');
    if (!deepLinkFacultyId || isStudent || isFaculty) return;
    setFilters({ ...EMPTY_FILTERS, facultyId: deepLinkFacultyId });
    setCategory('teacher');
    setScreen('grid');
  }, [searchParams, isStudent, isFaculty]);

  useEffect(() => {
    if (!isStudent || loading || !filters.level || !filters.year) return;

    const mine = schedules.filter((s) => s.level === filters.level && s.year === filters.year);
    const fingerprint = mine
      .map((s) => `${s.schedule_id}:${s.day}:${s.start_time}:${s.end_time}:${s.room}:${s.subject_id}:${s.faculty_id}`)
      .sort()
      .join('|');

    const storageKey = `schedule_seen_${currentUser?.username || 'guest'}`;
    let lastSeen = null;
    try {
      lastSeen = localStorage.getItem(storageKey);
    } catch {
      lastSeen = null;
    }

    if (lastSeen !== null && lastSeen !== fingerprint) {
      setShowUpdateBanner(true);
    }

    try {
      localStorage.setItem(storageKey, fingerprint);
    } catch {
      /* ignore - e.g. private browsing storage restrictions */
    }
  }, [isStudent, loading, schedules, filters.level, filters.year, currentUser]);

  const levels = useMemo(() => [...new Set(schedules.map((s) => s.level))].filter(Boolean).sort(), [schedules]);
  const yearsForPendingCourse = useMemo(
    () => [...new Set(schedules.filter((s) => s.level === pendingCourse).map((s) => s.year))].filter(Boolean).sort(),
    [schedules, pendingCourse]
  );
  const subjects = useMemo(() => {
    const map = new Map();
    schedules.forEach((s) => {
      if (s.subject_id && !map.has(s.subject_id)) {
        map.set(s.subject_id, { subject_id: s.subject_id, subject_code: s.subject_code, subject_name: s.subject_name });
      }
    });
    return [...map.values()].sort((a, b) => a.subject_code.localeCompare(b.subject_code));
  }, [schedules]);

  const schedulesWithConflicts = useMemo(() => {
    return schedules.map((entry) => {
      const conflicts = schedules.filter(
        (other) =>
          other.schedule_id !== entry.schedule_id &&
          other.room === entry.room &&
          other.day === entry.day &&
          entry.start_time < other.end_time &&
          entry.end_time > other.start_time
      );
      return { ...entry, hasConflict: conflicts.length > 0, conflicts };
    });
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    return schedulesWithConflicts.filter((s) => {
      if (filters.level && s.level !== filters.level) return false;
      if (filters.year && s.year !== filters.year) return false;
      if (filters.facultyId && String(s.faculty?.faculty_id) !== String(filters.facultyId)) return false;
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

  const handleScheduleSaved = (saved) =>
    setSchedules((prev) =>
      prev.some((s) => s.schedule_id === saved.schedule_id)
        ? prev.map((s) => (s.schedule_id === saved.schedule_id ? saved : s))
        : [...prev, saved]
    );

  const handleArchive = (entry) => {
    if (!window.confirm(`Archive ${entry.subject_code} on ${entry.day}? It will be hidden from the schedule, but not deleted.`)) return;
    api
      .patch(`/schedule/${entry.schedule_id}/archive`)
      .then(() => setSchedules((prev) => prev.filter((s) => s.schedule_id !== entry.schedule_id)))
      .catch(() => setError('Unable to archive that class.'));
  };

  const handleRestore = (entry) => {
    if (!window.confirm(`Restore ${entry.subject_code} on ${entry.day}? It will reappear in the active schedule.`)) return;
    api
      .patch(`/schedule/${entry.schedule_id}/restore`)
      .then(() => setSchedules((prev) => prev.filter((s) => s.schedule_id !== entry.schedule_id)))
      .catch(() => setError('Unable to restore that class.'));
  };

  const openArchivedView = () => {
    setFilters(EMPTY_FILTERS);
    setCategory(null);
    setScreen('grid');
    setViewingArchived(true);
  };
  const closeArchivedView = () => {
    setViewingArchived(false);
    backToLanding();
  };

  const openClassFlow = () => {
    setCategory('class');
    setScreen('pick-course');
  };
  const openTeacherFlow = () => {
    setCategory('teacher');
    setScreen('pick-teacher');
  };

  const pickCourseStep = (course) => {
    setPendingCourse(course);
    setScreen('pick-year');
  };
  const pickYearStep = (year) => {
    setFilters({ ...EMPTY_FILTERS, level: pendingCourse, year });
    setScreen('grid');
  };
  const pickTeacherStep = (facultyId) => {
    setFilters({ ...EMPTY_FILTERS, facultyId });
    setScreen('grid');
  };
  const backToLanding = () => {
    setScreen('landing');
    setCategory(null);
    setPendingCourse(null);
    setFilters(EMPTY_FILTERS);
  };
  const backToCoursePick = () => {
    setScreen('pick-course');
    setFilters(EMPTY_FILTERS);
  };

  const scopeLabel =
    category === 'teacher'
      ? faculties.find((f) => String(f.faculty_id) === String(filters.facultyId))?.name
      : category === 'class'
      ? [filters.level, filters.year].filter(Boolean).join(' · ')
      : '';

  const showGrid = isStudent || screen === 'grid';
  const showLanding = !isStudent && !isFaculty && screen === 'landing';
  const canBrowse = !isStudent && !isFaculty;

  const printedOn = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div>
      <div className="hidden print:flex items-end justify-between border-b-2 border-[#80172B] pb-3 mb-5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-extrabold text-3xl tracking-tighter text-[#80172B]">ABC</span>
          <span className="px-1.5 py-[2px] bg-[#182848] text-white text-[10px] font-bold tracking-wider rounded uppercase">
            School
          </span>
        </div>
        <div className="text-right text-[11px] text-gray-500 leading-tight">
          <p>Class Schedule &amp; Timetable</p>
          <p className="font-semibold text-gray-700">Printed {printedOn}{currentUser?.name ? ` · ${currentUser.name}` : ''}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 print:hidden">Class Schedule & Timetable</h2>
          {viewingArchived ? (
            <p className="text-sm text-gray-500 mt-1 print:hidden">
              Showing archived classes &mdash; hidden from the active schedule, but not deleted. Restore any of them below.
            </p>
          ) : isStudent && (filters.level || filters.year) ? (
            <p className="text-sm text-gray-500 mt-1 print:hidden">
              Showing your schedule
              {filters.level && (
                <span className="ml-2 inline-flex items-center bg-[#80172B]/10 text-[#80172B] text-xs font-bold px-2 py-0.5 rounded">
                  {filters.level}
                </span>
              )}
              {filters.year && (
                <span className="ml-1.5 inline-flex items-center bg-[#182848]/10 text-[#182848] text-xs font-bold px-2 py-0.5 rounded">
                  {filters.year}
                </span>
              )}
            </p>
          ) : showGrid && scopeLabel ? (
            <p className="text-sm text-gray-500 mt-1 print:hidden">
              Showing schedule for
              <span className="ml-2 inline-flex items-center bg-[#80172B]/10 text-[#80172B] text-xs font-bold px-2 py-0.5 rounded">
                {scopeLabel}
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1 print:hidden">
              Weekly calendar timetable view, course & year level filtering, instructor profile popups, conflict detection.
            </p>
          )}
        </div>
        <div className="print:hidden flex flex-wrap items-center gap-2">
          {isAdmin && !viewingArchived && (
            <button
              onClick={() => setEditingSchedule({})}
              className="flex items-center gap-2 bg-[#80172B] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#651020] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Schedule
            </button>
          )}
          {isAdmin && (
            <button
              onClick={viewingArchived ? closeArchivedView : openArchivedView}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Archive className="w-4 h-4" />
              {viewingArchived ? 'Back to Active Schedule' : 'View Archived'}
            </button>
          )}
          {showGrid && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-[#182848] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#0f1a33] transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Download PDF
            </button>
          )}
        </div>
      </div>

      {currentClass && (
        <div className="print:hidden bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
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
          {currentClass.faculty && !isFaculty && (
            <button
              onClick={() => setSelectedInstructor(currentClass.faculty)}
              className="flex items-center justify-center gap-1.5 bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors shrink-0"
            >
              Instructor Profile
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {isStudent && showUpdateBanner && (
        <div className="print:hidden bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wide text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                Schedule Updated
              </span>
              <p className="text-sm text-gray-800 mt-1">
                Your class schedule has changed since your last visit &mdash; check for new, moved, or removed classes below.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUpdateBanner(false)}
            className="text-sky-700 hover:text-sky-900 text-sm font-semibold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Loading schedule...</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      {!loading && !error && showLanding && (
        <div className="print:hidden bg-white border border-gray-200 rounded-xl p-8">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Browse the Schedule</h3>
            <p className="text-sm text-gray-500 mt-1">Choose how you'd like to view the class schedule.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
            <BrowseCard
              icon={BookOpen}
              title="By Course & Year"
              description="View every class under a specific course and year level"
              onClick={openClassFlow}
            />
            <BrowseCard
              icon={UserCheck}
              title="By Teacher"
              description="View a specific faculty member's teaching schedule"
              onClick={openTeacherFlow}
            />
          </div>
        </div>
      )}

      {!loading && !error && !isStudent && screen === 'pick-course' && (
        <div className="print:hidden bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <button onClick={backToLanding} className="flex items-center gap-1.5 text-xs font-semibold text-[#80172B] hover:underline mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Browse Options
          </button>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Select a Course</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {levels.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-full">No courses found in the schedule yet.</p>
            ) : (
              levels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => pickCourseStep(lvl)}
                  className="text-left px-3 py-2.5 border border-gray-200 rounded-lg hover:border-[#80172B] hover:bg-[#80172B]/5 transition-colors"
                >
                  <p className="text-sm font-semibold text-gray-900">{lvl}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {!loading && !error && !isStudent && screen === 'pick-year' && (
        <div className="print:hidden bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <button onClick={backToCoursePick} className="flex items-center gap-1.5 text-xs font-semibold text-[#80172B] hover:underline mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Courses
          </button>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Select a Year Level for {pendingCourse}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {yearsForPendingCourse.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-full">No year levels found for {pendingCourse} yet.</p>
            ) : (
              yearsForPendingCourse.map((yr) => (
                <button
                  key={yr}
                  onClick={() => pickYearStep(yr)}
                  className="text-left px-3 py-2.5 border border-gray-200 rounded-lg hover:border-[#80172B] hover:bg-[#80172B]/5 transition-colors"
                >
                  <p className="text-sm font-semibold text-gray-900">{yr}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {!loading && !error && !isStudent && screen === 'pick-teacher' && (
        <div className="print:hidden bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <button onClick={backToLanding} className="flex items-center gap-1.5 text-xs font-semibold text-[#80172B] hover:underline mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Browse Options
          </button>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Select a Teacher</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {faculties.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-full">No faculty records found.</p>
            ) : (
              faculties.map((f) => (
                <button
                  key={f.faculty_id}
                  onClick={() => pickTeacherStep(f.faculty_id)}
                  className="text-left px-3 py-2.5 border border-gray-200 rounded-lg hover:border-[#80172B] hover:bg-[#80172B]/5 transition-colors"
                >
                  <p className="text-sm font-semibold text-gray-900">{f.name}</p>
                  <p className="text-xs text-gray-500">{f.department}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {!loading && !error && showGrid && (
        <>
          <div className="print:hidden bg-white border border-gray-200 rounded-xl p-5 mb-6">
            {viewingArchived ? (
              <button onClick={closeArchivedView} className="flex items-center gap-1.5 text-xs font-semibold text-[#80172B] hover:underline mb-4">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Active Schedule
              </button>
            ) : (
              canBrowse && (
                <button onClick={backToLanding} className="flex items-center gap-1.5 text-xs font-semibold text-[#80172B] hover:underline mb-4">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change {category === 'teacher' ? 'Teacher' : 'Course & Year'}
                </button>
              )
            )}
            <div className={`grid grid-cols-1 gap-4 ${viewingArchived ? '' : 'md:grid-cols-2'}`}>
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

              {!viewingArchived && (
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
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden print:border-0 print:rounded-none">
            <div className={`px-5 py-4 border-b border-gray-200 print:hidden ${viewingArchived ? 'bg-amber-50' : ''}`}>
              <span className={`text-xs font-bold uppercase tracking-wide ${viewingArchived ? 'text-amber-700' : 'text-gray-500'}`}>
                {viewingArchived ? 'Archived Classes' : 'Weekly Timetable Calendar Grid'}
              </span>
            </div>

            {viewingArchived ? (
              <div className="divide-y divide-gray-100">
                {filteredSchedules.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-10">No archived classes found.</p>
                ) : (
                  [...filteredSchedules]
                    .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start_time.localeCompare(b.start_time))
                    .map((entry) => (
                      <div key={entry.schedule_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[#80172B] text-sm">{entry.subject_code}</span>
                            <span className="text-sm text-gray-600 break-words">{entry.subject_name}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {entry.day} &middot; {entry.start_time}-{entry.end_time} &middot; {entry.room}
                            {entry.faculty && <> &middot; {entry.faculty.name}</>}
                            {(entry.level || entry.year) && <> &middot; {[entry.level, entry.year].filter(Boolean).join(' ')}</>}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRestore(entry)}
                          className="flex items-center justify-center gap-1.5 shrink-0 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <ArchiveRestore className="w-3.5 h-3.5" />
                          Restore
                        </button>
                      </div>
                    ))
                )}
              </div>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full border-collapse table-auto sm:table-fixed print:table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 print:bg-[#182848]">
                      <th className="text-left text-[9px] sm:text-xs font-bold text-gray-500 uppercase p-0.5 sm:p-3 w-8 sm:w-28 print:w-auto print:text-white">
                        Time
                      </th>
                      {visibleDays.map((day) => (
                        <th key={day} className="text-left text-[9px] sm:text-xs font-bold text-gray-500 uppercase p-0.5 sm:p-3 sm:w-[160px] print:w-auto print:text-white">
                          <span className="sm:hidden">{day.slice(0, 3)}</span>
                          <span className="hidden sm:inline">{day}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((slot) => (
                      <tr key={slot.label} className="border-b border-gray-100 last:border-b-0">
                        <td className="p-0.5 sm:p-3 text-[8px] sm:text-xs font-bold text-gray-700 align-top w-8 sm:w-28 print:w-auto">
                          <span className="sm:hidden">{compactHour(slot.start)}-{compactHour(slot.end)}</span>
                          <span className="hidden sm:inline">{slot.label}</span>
                        </td>
                        {visibleDays.map((day) => (
                          <td key={day} className="p-0.5 sm:p-2 align-top border-l border-gray-100 sm:w-[160px] print:w-auto">
                            <ScheduleCell
                              entries={entriesFor(day, slot)}
                              onSelectEntry={setSelectedClassEntry}
                              isAdmin={isAdmin}
                              onEdit={setEditingSchedule}
                              onArchive={handleArchive}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <ClassDetailModal
        entry={selectedClassEntry}
        onClose={() => setSelectedClassEntry(null)}
        onViewInstructor={(faculty) => {
          setSelectedClassEntry(null);
          setSelectedInstructor(faculty);
        }}
        hideInstructorLink={isFaculty}
      />
      <InstructorProfileModal faculty={selectedInstructor} onClose={() => setSelectedInstructor(null)} />
      <ScheduleEditModal
        schedule={editingSchedule}
        subjects={subjects}
        onClose={() => setEditingSchedule(null)}
        onSaved={handleScheduleSaved}
      />
    </div>
  );
}

function BrowseCard({ icon: Icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center text-center gap-3 p-6 border border-gray-200 rounded-xl hover:border-[#80172B] hover:shadow-md transition-all"
    >
      <div className="w-14 h-14 rounded-full bg-[#80172B]/10 flex items-center justify-center group-hover:bg-[#80172B] transition-colors">
        <Icon className="w-7 h-7 text-[#80172B] group-hover:text-white transition-colors" />
      </div>
      <div>
        <p className="font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    </button>
  );
}
