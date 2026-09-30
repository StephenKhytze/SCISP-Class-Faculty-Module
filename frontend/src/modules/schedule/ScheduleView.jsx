import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, FileDown, Lightbulb, ArrowRight, ArrowLeft, UserCheck, GraduationCap, School, Landmark, Plus, Bell, Archive, ArchiveRestore, BookOpen, Building2 } from 'lucide-react';
import api from '../../services/api';
import ScheduleCell from './components/ScheduleCell';
import InstructorProfileModal from './components/InstructorProfileModal';
import ClassDetailModal from './components/ClassDetailModal';
import ScheduleEditModal from './components/ScheduleEditModal';
import AddCourseModal from './components/AddCourseModal';
import AddClassSectionModal from './components/AddClassSectionModal';
import ManageSubjectsModal from './components/ManageSubjectsModal';
import ManageRoomsModal from './components/ManageRoomsModal';
import { SCHEDULE_DAYS, TIME_SLOTS, EDUCATION_LEVELS, BASIC_ED_YEAR_GROUPS, STRANDS, isSeniorHigh, slotsSpannedBy, currentDayName, currentTimeHHMM, compactHour } from './constants';

const EDUCATION_LEVEL_ICONS = { College: Landmark, Masteral: GraduationCap, 'Basic Ed': School };
const EDUCATION_LEVEL_DESCRIPTIONS = {
  College: 'View every College class by course, year level, and section',
  Masteral: 'View every Masteral class by graduate program, year level, and section',
  'Basic Ed': 'View every Basic Ed class by grade level and section',
};

const EMPTY_FILTERS = {
  search: '',
  educationLevel: '',
  level: '',
  year: '',
  strand: '',
  section: '',
  facultyId: '',
  dayRange: 'all',
};

export default function ScheduleView() {
  const [schedules, setSchedules] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [archivedClassSections, setArchivedClassSections] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedClassEntry, setSelectedClassEntry] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [viewingArchived, setViewingArchived] = useState(false);
  const [addingCourse, setAddingCourse] = useState(false);
  const [addingYearLevel, setAddingYearLevel] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [addingStrand, setAddingStrand] = useState(false);
  const [managingSubjects, setManagingSubjects] = useState(false);
  const [managingRooms, setManagingRooms] = useState(false);

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

  // screen: landing
  //   -> pick-basic-ed-level -> pick-grade -> [pick-strand, SHS only] -> pick-section -> grid
  //   -> pick-course -> pick-year -> pick-section -> grid
  //   -> pick-teacher -> grid
  const [screen, setScreen] = useState('landing');
  const [category, setCategory] = useState(null); // 'class' | 'teacher' | null
  const [educationCategory, setEducationCategory] = useState(null); // College | Masteral | Basic Ed
  const [basicEdLevel, setBasicEdLevel] = useState(null); // Elementary | Junior High School | Senior High School
  const [pendingCourseId, setPendingCourseId] = useState(null);
  const [pendingProgram, setPendingProgram] = useState(null); // course code, matches schedules.level
  const [pendingProgramName, setPendingProgramName] = useState(null); // course full name, for display
  const [pendingGrade, setPendingGrade] = useState(null); // Basic Ed grade, or College/Masteral year level
  const [pendingStrand, setPendingStrand] = useState(null); // Basic Ed SHS strand

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
    api.get('/courses').then((res) => setCourses(res.data)).catch(() => setCourses([]));
    api.get('/class-sections').then((res) => setClassSections(res.data)).catch(() => setClassSections([]));
    api
      .get('/class-sections', { params: { archived: 1 } })
      .then((res) => setArchivedClassSections(res.data))
      .catch(() => setArchivedClassSections([]));
    api.get('/rooms').then((res) => setRooms(res.data)).catch(() => setRooms([]));
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

  // Courses/programs available under the currently browsed education category - sourced
  // from the courses reference table (not derived from schedules), so a course with zero
  // classes yet still shows up as a pickable option.
  const programs = useMemo(
    () => courses.filter((c) => c.education_level === educationCategory).sort((a, b) => a.code.localeCompare(b.code)),
    [courses, educationCategory]
  );
  const yearsForPendingProgram = useMemo(
    () =>
      [...new Set(classSections.filter((s) => s.course_id === pendingCourseId).map((s) => s.year_label))]
        .filter(Boolean)
        .sort(),
    [classSections, pendingCourseId]
  );

  // Strands for the SHS grade being browsed - the fixed 7-strand list always shows by
  // default (as it always has), minus whichever ones an admin explicitly archived for this
  // grade. Archiving/restoring a strand is tracked as a placeholder class_sections row
  // (education_level/level_label/year_label/strand, no section_name) rather than a real
  // section, so it never touches an actual class section sharing the same strand name.
  const archivedStrandNames = useMemo(() => {
    return new Set(
      archivedClassSections
        .filter(
          (s) =>
            s.education_level === 'Basic Ed' && s.level_label === basicEdLevel && s.year_label === pendingGrade && s.strand && !s.section_name
        )
        .map((s) => s.strand)
    );
  }, [archivedClassSections, basicEdLevel, pendingGrade]);

  const visibleStrands = useMemo(() => STRANDS.filter((s) => !archivedStrandNames.has(s)), [archivedStrandNames]);

  // Sections available for whatever scope has been narrowed down so far - always offers
  // an "All Sections" fallback so records saved without a section stay reachable. Kept as
  // the actual row (not just the name) so each can be archived individually.
  const sectionsInScope = useMemo(() => {
    const matches = classSections.filter((s) => {
      if (!s.section_name) return false;
      if (s.education_level !== educationCategory) return false;
      if (educationCategory === 'Basic Ed') {
        if (s.level_label !== basicEdLevel || s.year_label !== pendingGrade) return false;
        if (isSeniorHigh(pendingGrade) && s.strand !== pendingStrand) return false;
        return true;
      }
      return s.course_id === pendingCourseId && s.year_label === pendingGrade;
    });
    const byName = new Map();
    matches.forEach((s) => {
      if (!byName.has(s.section_name)) byName.set(s.section_name, s);
    });
    return [...byName.values()].sort((a, b) => a.section_name.localeCompare(b.section_name));
  }, [classSections, educationCategory, basicEdLevel, pendingGrade, pendingStrand, pendingCourseId]);

  // Three distinct conflict scopes, checked separately:
  //  - Faculty overlap: same teacher, two classes at once - an admin/faculty problem.
  //  - Room overlap: same room, two classes at once - also an admin/faculty problem, but
  //    not necessarily the same pair of classes as the faculty overlap above.
  //  - Student personal overlap: the student's OWN section double-booked with two
  //    different subjects at once - the only kind of conflict a student can actually see
  //    the full picture of (and the only kind that's actually theirs to worry about).
  // A student never sees a faculty/room conflict on their own class card: from their
  // filtered view the other half of that clash usually belongs to a different section they
  // can't see anyway, which just looks like an unexplained warning rather than something
  // they could act on. Admin/Faculty keep seeing both, since they can act on either.
  const schedulesWithConflicts = useMemo(() => {
    return schedules.map((entry) => {
      const overlapsWith = (other) =>
        other.schedule_id !== entry.schedule_id &&
        other.day === entry.day &&
        entry.start_time < other.end_time &&
        entry.end_time > other.start_time;

      const facultyConflicts = schedules.filter((other) => overlapsWith(other) && other.faculty_id === entry.faculty_id);
      const roomConflicts = schedules.filter(
        (other) =>
          overlapsWith(other) &&
          entry.room?.trim() &&
          other.room?.trim().toLowerCase() === entry.room.trim().toLowerCase()
      );
      const studentConflicts = schedules.filter(
        (other) =>
          overlapsWith(other) &&
          other.subject_id !== entry.subject_id &&
          other.education_level === entry.education_level &&
          other.level === entry.level &&
          other.year === entry.year &&
          other.strand === entry.strand &&
          other.section === entry.section
      );

      const relevantConflicts = isStudent ? studentConflicts : [...facultyConflicts, ...roomConflicts];
      const conflicts = [...new Map(relevantConflicts.map((c) => [c.schedule_id, c])).values()];

      const reasonParts = [];
      if (isStudent) {
        if (studentConflicts.length > 0) reasonParts.push('your section is double-booked');
      } else {
        if (facultyConflicts.length > 0) reasonParts.push('same instructor');
        if (roomConflicts.length > 0) reasonParts.push('same room');
      }

      return { ...entry, hasConflict: conflicts.length > 0, conflicts, conflictReason: reasonParts.join(' & ') };
    });
  }, [schedules, isStudent]);

  const filteredSchedules = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    return schedulesWithConflicts.filter((s) => {
      if (filters.educationLevel && s.education_level !== filters.educationLevel) return false;
      if (filters.level && s.level !== filters.level) return false;
      if (filters.year && s.year !== filters.year) return false;
      if (filters.strand && s.strand !== filters.strand) return false;
      if (filters.section && s.section !== filters.section) return false;
      if (filters.facultyId && String(s.faculty?.faculty_id) !== String(filters.facultyId)) return false;
      if (keyword) {
        const haystack = `${s.subject_code} ${s.subject_name} ${s.room}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      return true;
    });
  }, [schedulesWithConflicts, filters]);

  // Basic Ed never runs Sunday classes - College/Masteral (weekend/evening programs) can.
  // "Filter Day" narrows down to one specific day instead of an all-or-nothing range.
  const daysForContext = useMemo(
    () => (filters.educationLevel === 'Basic Ed' ? SCHEDULE_DAYS.filter((d) => d !== 'Sunday') : SCHEDULE_DAYS),
    [filters.educationLevel]
  );
  const visibleDays = useMemo(
    () => (daysForContext.includes(filters.dayRange) ? [filters.dayRange] : daysForContext),
    [daysForContext, filters.dayRange]
  );

  // Renders each day's column as merged rowSpan blocks instead of repeating a class in
  // every 1-hour slot it touches: a slot already covered by an earlier row's rowSpan
  // gets `render: false` and is skipped entirely (no <td> emitted for it at all).
  const dayPlans = useMemo(() => {
    const plans = {};
    visibleDays.forEach((day) => {
      const entriesForDay = filteredSchedules.filter((s) => s.day === day);
      const plan = new Array(TIME_SLOTS.length).fill(null);
      for (let i = 0; i < TIME_SLOTS.length; i++) {
        if (plan[i]) continue;
        const slot = TIME_SLOTS[i];
        const overlapping = entriesForDay.filter((e) => e.start_time < slot.end && e.end_time > slot.start);
        if (overlapping.length === 0) {
          plan[i] = { render: true, rowSpan: 1, entries: [] };
          continue;
        }
        const span = Math.min(Math.max(...overlapping.map(slotsSpannedBy)), TIME_SLOTS.length - i);
        plan[i] = { render: true, rowSpan: span, entries: overlapping };
        for (let j = 1; j < span; j++) plan[i + j] = { render: false };
      }
      plans[day] = plan;
    });
    return plans;
  }, [visibleDays, filteredSchedules]);

  // "Current class" is a personal indicator ("you currently have X") - scope it to the
  // logged-in student's own level/year or the logged-in teacher's own classes. Admin has
  // no personal schedule, so it never shows for that role.
  const currentClass = useMemo(() => {
    const day = currentDayName();
    const time = currentTimeHHMM();
    if (!day) return null;
    if (isStudent) {
      if (!filters.level || !filters.year) return null;
      return (
        schedules.find(
          (s) => s.day === day && s.start_time <= time && s.end_time > time && s.level === filters.level && s.year === filters.year
        ) || null
      );
    }
    if (isFaculty) {
      if (!filters.facultyId) return null;
      return (
        schedules.find(
          (s) => s.day === day && s.start_time <= time && s.end_time > time && String(s.faculty_id) === String(filters.facultyId)
        ) || null
      );
    }
    return null;
  }, [schedules, isStudent, isFaculty, filters.level, filters.year, filters.facultyId]);

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

  const handleArchiveSection = (section, e) => {
    e.stopPropagation();
    if (!window.confirm(`Archive Section ${section.section_name}? It will be hidden from this picker, but not deleted.`)) return;
    api
      .patch(`/class-sections/${section.class_section_id}/archive`)
      .then(() => setClassSections((prev) => prev.filter((s) => s.class_section_id !== section.class_section_id)))
      .catch(() => setError('Unable to archive that section.'));
  };

  const handleArchiveStrand = (strandName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Archive the ${strandName} strand for ${pendingGrade}? It will be hidden from this picker, but not deleted.`)) return;
    // The strand may not have a class_sections row yet at all (it's shown by default from
    // the fixed list) - register a placeholder for it first if needed, then archive that.
    const placeholder = classSections.find(
      (s) =>
        s.education_level === 'Basic Ed' && s.level_label === basicEdLevel && s.year_label === pendingGrade && s.strand === strandName && !s.section_name
    );
    const ensureRow = placeholder
      ? Promise.resolve(placeholder)
      : api
          .post('/class-sections', { education_level: 'Basic Ed', level_label: basicEdLevel, year_label: pendingGrade, strand: strandName })
          .then((res) => res.data);

    ensureRow
      .then((row) => api.patch(`/class-sections/${row.class_section_id}/archive`))
      .then((res) => {
        setClassSections((prev) => prev.filter((s) => s.class_section_id !== res.data.class_section_id));
        setArchivedClassSections((prev) => [...prev.filter((s) => s.class_section_id !== res.data.class_section_id), res.data]);
      })
      .catch(() => setError('Unable to archive that strand.'));
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

  // --- Navigation: Basic Ed and College/Masteral both funnel into pick-section, then grid ---

  const openClassFlow = (level) => {
    setCategory('class');
    setEducationCategory(level);
    setBasicEdLevel(null);
    setPendingCourseId(null);
    setPendingProgram(null);
    setPendingProgramName(null);
    setPendingGrade(null);
    setPendingStrand(null);
    setScreen(level === 'Basic Ed' ? 'pick-basic-ed-level' : 'pick-course');
  };
  const openTeacherFlow = () => {
    setCategory('teacher');
    setScreen('pick-teacher');
  };

  const pickBasicEdLevelStep = (level) => {
    setBasicEdLevel(level);
    setPendingGrade(null);
    setPendingStrand(null);
    setScreen('pick-grade');
  };
  const pickGradeStep = (grade) => {
    setPendingGrade(grade);
    setPendingStrand(null);
    setScreen(isSeniorHigh(grade) ? 'pick-strand' : 'pick-section');
  };
  const pickStrandStep = (strand) => {
    setPendingStrand(strand);
    setScreen('pick-section');
  };

  const pickCourseStep = (course) => {
    setPendingCourseId(course.course_id);
    setPendingProgram(course.code);
    setPendingProgramName(course.name);
    setPendingGrade(null);
    setScreen('pick-year');
  };
  const pickYearStep = (year) => {
    setPendingGrade(year);
    setScreen('pick-section');
  };

  const pickSectionStep = (section) => {
    if (educationCategory === 'Basic Ed') {
      setFilters({
        ...EMPTY_FILTERS,
        educationLevel: 'Basic Ed',
        level: basicEdLevel,
        year: pendingGrade,
        strand: pendingStrand || '',
        section,
      });
    } else {
      setFilters({
        ...EMPTY_FILTERS,
        educationLevel: educationCategory,
        level: pendingProgram,
        year: pendingGrade,
        section,
      });
    }
    setScreen('grid');
  };

  const pickTeacherStep = (facultyId) => {
    setFilters({ ...EMPTY_FILTERS, facultyId });
    setScreen('grid');
  };

  const backToLanding = () => {
    setScreen('landing');
    setCategory(null);
    setEducationCategory(null);
    setBasicEdLevel(null);
    setPendingCourseId(null);
    setPendingProgram(null);
    setPendingProgramName(null);
    setPendingGrade(null);
    setPendingStrand(null);
    setFilters(EMPTY_FILTERS);
  };
  const backToBasicEdLevelPick = () => {
    setScreen('pick-basic-ed-level');
    setBasicEdLevel(null);
    setPendingGrade(null);
    setPendingStrand(null);
    setFilters(EMPTY_FILTERS);
  };
  const backToGradePick = () => {
    setScreen('pick-grade');
    setPendingStrand(null);
    setFilters(EMPTY_FILTERS);
  };
  const backToCoursePick = () => {
    setScreen('pick-course');
    setPendingCourseId(null);
    setPendingProgram(null);
    setPendingProgramName(null);
    setPendingGrade(null);
    setFilters(EMPTY_FILTERS);
  };
  const backFromSectionPick = () => {
    setFilters(EMPTY_FILTERS);
    if (educationCategory === 'Basic Ed') {
      setScreen(isSeniorHigh(pendingGrade) ? 'pick-strand' : 'pick-grade');
    } else {
      setScreen('pick-year');
    }
  };
  // From the grid, "Back to Sections" returns to the section picker itself (one level
  // up), not past it - backFromSectionPick is for the section picker's own back-link.
  const backToSectionPick = () => {
    setScreen('pick-section');
    setFilters(EMPTY_FILTERS);
  };

  const programLabel = educationCategory === 'Masteral' ? 'Graduate Program' : 'Course';

  const scopeLabel =
    category === 'teacher'
      ? faculties.find((f) => String(f.faculty_id) === String(filters.facultyId))?.name
      : category === 'class'
      ? [
          filters.educationLevel,
          filters.educationLevel === 'Basic Ed' ? basicEdLevel : null,
          filters.educationLevel === 'Basic Ed' ? null : filters.level,
          filters.year,
          filters.strand,
          filters.section && `Section ${filters.section}`,
        ]
          .filter(Boolean)
          .join(' · ')
      : '';

  const showGrid = isStudent || screen === 'grid';
  const showLanding = !isStudent && !isFaculty && screen === 'landing';
  const canBrowse = !isStudent && !isFaculty;
  // Add Schedule only makes sense once the admin has drilled down to one specific
  // class/section timetable - never on a picker screen, the landing page, or the
  // read-only "By Teacher" browse view.
  const showAddSchedule = isAdmin && !viewingArchived && screen === 'grid' && category === 'class';

  const scheduleModalContext =
    category === 'class' && screen === 'grid'
      ? {
          education_level: filters.educationLevel,
          level: filters.level,
          year: filters.year,
          strand: filters.strand,
          section: filters.section,
        }
      : null;

  // What Manage Subjects and the Add Schedule form's filtered dropdowns key off of.
  const subjectScopeContext = {
    course_id: pendingCourseId || null,
    year_label: filters.year || null,
    strand: filters.strand || null,
  };

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
          {showAddSchedule && (
            <button
              onClick={() => setManagingSubjects(true)}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Manage Subjects
            </button>
          )}
          {showAddSchedule && (
            <button
              onClick={() => setEditingSchedule({})}
              className="flex items-center gap-2 bg-[#80172B] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[#651020] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Schedule
            </button>
          )}
          {showAddSchedule && (
            <button
              onClick={() => setManagingRooms(true)}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Manage Rooms
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
            {EDUCATION_LEVELS.map((lvl) => (
              <BrowseCard
                key={lvl}
                icon={EDUCATION_LEVEL_ICONS[lvl]}
                title={lvl}
                description={EDUCATION_LEVEL_DESCRIPTIONS[lvl]}
                onClick={() => openClassFlow(lvl)}
              />
            ))}
            <BrowseCard
              icon={UserCheck}
              title="By Teacher"
              description="View a specific faculty member's teaching schedule"
              onClick={openTeacherFlow}
            />
          </div>
        </div>
      )}

      {!loading && !error && !isStudent && screen === 'pick-basic-ed-level' && (
        <div className="print:hidden bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <button onClick={backToLanding} className="flex items-center gap-1.5 text-xs font-semibold text-[#80172B] hover:underline mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Browse Options
          </button>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Select a Level under Basic Ed</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
            {Object.entries(BASIC_ED_YEAR_GROUPS).map(([group, grades]) => (
              <button
                key={group}
                onClick={() => pickBasicEdLevelStep(group)}
                className="text-left px-4 py-4 border border-gray-200 rounded-lg hover:border-[#80172B] hover:bg-[#80172B]/5 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-900">{group}</p>
                <p className="text-xs text-gray-500 mt-0.5">{grades[0]} - {grades[grades.length - 1]}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && !isStudent && screen === 'pick-grade' && (
        <div className="print:hidden bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <button onClick={backToBasicEdLevelPick} className="flex items-center gap-1.5 text-xs font-semibold text-[#80172B] hover:underline mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Levels
          </button>
          <h3 className="text-sm font-bold text-gray-900 mb-3">Select a Grade under {basicEdLevel}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {(BASIC_ED_YEAR_GROUPS[basicEdLevel] || []).map((grade) => (
              <button
                key={grade}
                onClick={() => pickGradeStep(grade)}
                className="text-left px-3 py-2.5 border border-gray-200 rounded-lg hover:border-[#80172B] hover:bg-[#80172B]/5 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-900">{grade}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && !isStudent && screen === 'pick-strand' && (
        <div className="print:hidden bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <button onClick={backToGradePick} className="flex items-center gap-1.5 text-xs font-semibold text-[#80172B] hover:underline mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Grades
          </button>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-bold text-gray-900">Select a Strand for {pendingGrade}</h3>
            {isAdmin && (
              <button
                onClick={() => setAddingStrand(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#80172B] hover:underline shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Strand
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {visibleStrands.map((s) => (
              <div
                key={s}
                className="relative flex items-center border border-gray-200 rounded-lg hover:border-[#80172B] hover:bg-[#80172B]/5 transition-colors"
              >
                <button
                  onClick={() => pickStrandStep(s)}
                  className="flex-1 text-left px-3 py-2.5"
                >
                  <p className="text-sm font-semibold text-gray-900">{s}</p>
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => handleArchiveStrand(s, e)}
                    title="Archive this strand"
                    className="text-gray-300 hover:text-amber-600 transition-colors pr-3 shrink-0"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && !isStudent && screen === 'pick-course' && (
        <div className="print:hidden bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <button onClick={backToLanding} className="flex items-center gap-1.5 text-xs font-semibold text-[#80172B] hover:underline mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Browse Options
          </button>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-bold text-gray-900">Select a {programLabel} under {educationCategory}</h3>
            {isAdmin && (
              <button
                onClick={() => setAddingCourse(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#80172B] hover:underline shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add {programLabel}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {programs.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-full">No {educationCategory} {programLabel.toLowerCase()}s added yet.</p>
            ) : (
              programs.map((course) => (
                <button
                  key={course.course_id}
                  onClick={() => pickCourseStep(course)}
                  className="text-left px-3 py-2.5 border border-gray-200 rounded-lg hover:border-[#80172B] hover:bg-[#80172B]/5 transition-colors"
                >
                  <p className="text-sm font-semibold text-gray-900">{course.name}</p>
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
            Back to {programLabel}s
          </button>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-bold text-gray-900">Select a Year Level for {pendingProgramName}</h3>
            {isAdmin && (
              <button
                onClick={() => setAddingYearLevel(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#80172B] hover:underline shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Year Level
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {yearsForPendingProgram.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-full">No year levels added for {pendingProgramName} yet.</p>
            ) : (
              yearsForPendingProgram.map((yr) => (
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

      {!loading && !error && !isStudent && screen === 'pick-section' && (
        <div className="print:hidden bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <button onClick={backFromSectionPick} className="flex items-center gap-1.5 text-xs font-semibold text-[#80172B] hover:underline mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to {educationCategory === 'Basic Ed' ? (isSeniorHigh(pendingGrade) ? 'Strands' : 'Grades') : 'Year Levels'}
          </button>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-bold text-gray-900">Select a Section</h3>
            {isAdmin && (
              <button
                onClick={() => setAddingSection(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#80172B] hover:underline shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Section
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {sectionsInScope.map((section) => (
              <div
                key={section.class_section_id}
                className="relative flex items-center border border-gray-200 rounded-lg hover:border-[#80172B] hover:bg-[#80172B]/5 transition-colors"
              >
                <button
                  onClick={() => pickSectionStep(section.section_name)}
                  className="flex-1 text-left px-3 py-2.5"
                >
                  <p className="text-sm font-semibold text-gray-900">Section {section.section_name}</p>
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => handleArchiveSection(section, e)}
                    title="Archive this section"
                    className="text-gray-300 hover:text-amber-600 transition-colors pr-3 shrink-0"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => pickSectionStep('')}
              className="text-left px-3 py-2.5 border border-dashed border-gray-300 rounded-lg hover:border-[#80172B] hover:bg-[#80172B]/5 transition-colors"
            >
              <p className="text-sm font-semibold text-gray-900">All Sections</p>
              <p className="text-xs text-gray-500 mt-0.5">Classes not assigned to a specific section</p>
            </button>
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
                <button
                  onClick={category === 'teacher' ? backToLanding : backToSectionPick}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#80172B] hover:underline mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {category === 'teacher' ? 'Change Teacher' : 'Back to Sections'}
                </button>
              )
            )}
            <div
              className={`grid grid-cols-1 gap-4 ${
                viewingArchived ? '' : isSeniorHigh(filters.year) ? 'md:grid-cols-3' : 'md:grid-cols-2'
              }`}
            >
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

              {!viewingArchived && isSeniorHigh(filters.year) && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase">Strand</label>
                  <select
                    value={filters.strand}
                    onChange={(e) => setFilters((f) => ({ ...f, strand: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
                  >
                    <option value="">All Strands</option>
                    {STRANDS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {!viewingArchived && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase">Filter Day</label>
                  <select
                    value={filters.dayRange}
                    onChange={(e) => setFilters((f) => ({ ...f, dayRange: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
                  >
                    <option value="all">All Days</option>
                    {daysForContext.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
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
                    .sort((a, b) => SCHEDULE_DAYS.indexOf(a.day) - SCHEDULE_DAYS.indexOf(b.day) || a.start_time.localeCompare(b.start_time))
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
                    {TIME_SLOTS.map((slot, slotIdx) => (
                      <tr key={slot.label} className="border-b border-gray-100 last:border-b-0">
                        <td className="p-0.5 sm:p-3 text-[8px] sm:text-xs font-bold text-gray-700 align-top w-8 sm:w-28 print:w-auto">
                          <span className="sm:hidden">{compactHour(slot.start)}-{compactHour(slot.end)}</span>
                          <span className="hidden sm:inline">{slot.label}</span>
                        </td>
                        {visibleDays.map((day) => {
                          const cell = dayPlans[day]?.[slotIdx];
                          if (!cell?.render) return null;
                          return (
                            <td
                              key={day}
                              rowSpan={cell.rowSpan}
                              className="p-0.5 sm:p-2 align-top border-l border-gray-100 sm:w-[160px] print:w-auto"
                            >
                              <ScheduleCell
                                entries={cell.entries}
                                onSelectEntry={setSelectedClassEntry}
                                isAdmin={isAdmin}
                                onEdit={setEditingSchedule}
                                onArchive={handleArchive}
                              />
                            </td>
                          );
                        })}
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
        allSchedules={schedules}
        faculties={faculties}
        rooms={rooms}
        subjectScopeContext={subjectScopeContext}
        context={scheduleModalContext}
        onClose={() => setEditingSchedule(null)}
        onSaved={handleScheduleSaved}
        onOpenManageSubjects={() => {
          setEditingSchedule(null);
          setManagingSubjects(true);
        }}
        onOpenManageRooms={() => {
          setEditingSchedule(null);
          setManagingRooms(true);
        }}
      />
      <AddCourseModal
        open={addingCourse}
        educationLevel={educationCategory}
        onClose={() => setAddingCourse(false)}
        onSaved={(course) => setCourses((prev) => [...prev, course])}
      />
      <AddClassSectionModal
        open={addingYearLevel}
        mode="year"
        context={{ education_level: educationCategory, course_id: pendingCourseId }}
        onClose={() => setAddingYearLevel(false)}
        onSaved={(section) => setClassSections((prev) => [...prev, section])}
      />
      <AddClassSectionModal
        open={addingStrand}
        mode="strand"
        context={{ education_level: 'Basic Ed', level_label: basicEdLevel, year_label: pendingGrade }}
        strandOptions={[...archivedStrandNames]}
        onClose={() => setAddingStrand(false)}
        onSaved={(section) => {
          setClassSections((prev) => [...prev, section]);
          setArchivedClassSections((prev) => prev.filter((s) => s.class_section_id !== section.class_section_id));
        }}
      />
      <AddClassSectionModal
        open={addingSection}
        mode="section"
        context={
          educationCategory === 'Basic Ed'
            ? { education_level: 'Basic Ed', level_label: basicEdLevel, year_label: pendingGrade, strand: pendingStrand || null }
            : { education_level: educationCategory, course_id: pendingCourseId, year_label: pendingGrade }
        }
        onClose={() => setAddingSection(false)}
        onSaved={(section) => setClassSections((prev) => [...prev, section])}
      />
      <ManageSubjectsModal
        open={managingSubjects}
        context={subjectScopeContext}
        contextLabel={scopeLabel}
        onClose={() => setManagingSubjects(false)}
      />
      <ManageRoomsModal
        open={managingRooms}
        onClose={() => setManagingRooms(false)}
        onChanged={() => api.get('/rooms').then((res) => setRooms(res.data)).catch(() => {})}
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
