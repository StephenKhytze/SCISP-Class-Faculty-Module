import { useEffect, useMemo, useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';
import { DAYS, SCHEDULE_DAYS } from '../constants';
import { to12Hour } from '../../faculty/officeHours';
import RoomCombobox from './RoomCombobox';

const FIELD_DEFAULTS = {
  subject_id: '',
  subject_code: '',
  subject_name: '',
  faculty_id: '',
  room_id: '',
  day: DAYS[0],
  start_time: '',
  end_time: '',
};

// The education level / course / year / strand / section are no longer editable here -
// they're inherited from the timetable the admin is already viewing (passed in as
// `context`), so every class added stays correctly scoped to that section by construction.
export default function ScheduleEditModal({
  schedule,
  allSchedules = [],
  faculties = [],
  rooms = [],
  subjectScopeContext,
  context,
  onClose,
  onSaved,
  onOpenManageSubjects,
  onOpenManageRooms,
}) {
  const [form, setForm] = useState(FIELD_DEFAULTS);
  const [scopedSubjects, setScopedSubjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = Boolean(schedule?.schedule_id);

  const selectedFaculty = faculties.find((f) => String(f.faculty_id) === String(form.faculty_id));

  const facultySchedule = useMemo(
    () =>
      allSchedules
        .filter((s) => String(s.faculty_id) === String(form.faculty_id) && s.schedule_id !== schedule?.schedule_id)
        .sort((a, b) => SCHEDULE_DAYS.indexOf(a.day) - SCHEDULE_DAYS.indexOf(b.day) || a.start_time.localeCompare(b.start_time)),
    [allSchedules, form.faculty_id, schedule]
  );

  const facultyConflict = useMemo(() => {
    if (!form.day || !form.start_time || !form.end_time) return null;
    return (
      facultySchedule.find(
        (s) => s.day === form.day && form.start_time < s.end_time && form.end_time > s.start_time
      ) || null
    );
  }, [facultySchedule, form.day, form.start_time, form.end_time]);

  const roomConflict = useMemo(() => {
    if (!form.room_id || !form.day || !form.start_time || !form.end_time) return null;
    return (
      allSchedules.find(
        (s) =>
          s.schedule_id !== schedule?.schedule_id &&
          String(s.room_id) === String(form.room_id) &&
          s.day === form.day &&
          form.start_time < s.end_time &&
          form.end_time > s.start_time
      ) || null
    );
  }, [allSchedules, form.room_id, form.day, form.start_time, form.end_time, schedule]);

  useEffect(() => {
    if (!schedule) return;
    setForm({
      subject_id: schedule.subject_id || '',
      subject_code: schedule.subject_code || '',
      subject_name: schedule.subject_name || '',
      faculty_id: schedule.faculty_id || '',
      room_id: schedule.room_id || '',
      day: schedule.day || DAYS[0],
      start_time: schedule.start_time || '',
      end_time: schedule.end_time || '',
    });
    setError(null);
  }, [schedule]);

  useEffect(() => {
    if (!schedule || !subjectScopeContext) return;
    api
      .get('/subjects', { params: subjectScopeContext })
      .then((res) => setScopedSubjects(res.data))
      .catch(() => setScopedSubjects([]));
  }, [schedule, subjectScopeContext?.course_id, subjectScopeContext?.year_label, subjectScopeContext?.strand]);

  // Falls back to the entry's own saved context when editing, in case it was opened
  // some other way than from its matching timetable. Computed unconditionally (before the
  // early return below) since contextSubjects, a hook, depends on it.
  const effectiveContext = useMemo(() => {
    if (context) return context;
    if (!schedule) return {};
    return {
      education_level: schedule.education_level,
      level: schedule.level,
      year: schedule.year,
      strand: schedule.strand,
      section: schedule.section,
    };
  }, [context, schedule]);

  // Subjects already taught in this exact scope (same education level/level/year/strand),
  // read straight off the live timetable rather than the `subjects` prop, which is every
  // subject ever scheduled system-wide - without this, a Basic Ed Grade 1 class would see
  // College/Masteral subjects in its suggestions the moment no subject has been explicitly
  // assigned via Manage Subjects yet (scopedSubjects empty).
  const contextSubjects = useMemo(() => {
    const map = new Map();
    allSchedules.forEach((s) => {
      if (!s.subject_id) return;
      if (s.education_level !== effectiveContext.education_level) return;
      if (s.level !== effectiveContext.level) return;
      if (s.year !== effectiveContext.year) return;
      if (effectiveContext.strand && s.strand !== effectiveContext.strand) return;
      if (!map.has(s.subject_id)) {
        map.set(s.subject_id, { subject_id: s.subject_id, subject_code: s.subject_code, subject_name: s.subject_name });
      }
    });
    return [...map.values()];
  }, [allSchedules, effectiveContext]);

  if (!schedule) return null;

  // Basic Ed stores its level (Elementary/JHS/SHS) in `level`, everyone else in
  // `education_level` - either way it's what a teacher's teaching_levels are checked
  // against. Faculty with no teaching_levels set yet are shown too, so a newly-added
  // teacher isn't invisible until someone remembers to tag them.
  const requiredTeachingLevel = effectiveContext.education_level === 'Basic Ed' ? effectiveContext.level : effectiveContext.education_level;
  // Basic Ed classroom teachers are usually tied to one specific grade, not every grade
  // within their level (a Grade 1 teacher shouldn't show up for a Grade 4 section). Only
  // Basic Ed has this extra narrowing - College/Masteral has no "grade" concept here.
  const requiredGrade = effectiveContext.education_level === 'Basic Ed' ? effectiveContext.year : null;
  const availableFaculties = faculties.filter((f) => {
    const levelOk = !f.teaching_levels || f.teaching_levels.length === 0 || f.teaching_levels.includes(requiredTeachingLevel);
    if (!levelOk) return false;
    if (!requiredGrade) return true;
    return !f.teaching_grades || f.teaching_grades.length === 0 || f.teaching_grades.includes(requiredGrade);
  });

  const subjectOptions = scopedSubjects.length > 0 ? scopedSubjects : contextSubjects;

  const contextLabel = [
    effectiveContext.education_level,
    effectiveContext.level,
    effectiveContext.year,
    effectiveContext.strand,
    effectiveContext.section && `Section ${effectiveContext.section}`,
  ]
    .filter(Boolean)
    .join(' • ');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // A subject must already exist in the catalog (added via Manage Subjects) - picking one
  // here just fills in its code/name, it never creates a new one on the fly.
  const handleSubjectSelect = (e) => {
    const id = e.target.value;
    const match = subjectOptions.find((s) => String(s.subject_id) === id);
    // Auto-fill Room from the most recent class taught under this subject, but only
    // when the admin hasn't already picked one themselves.
    const lastRoomIdForSubject = match
      ? [...allSchedules].reverse().find((s) => s.subject_id === match.subject_id && s.room_id)?.room_id
      : null;

    setForm((f) => ({
      ...f,
      subject_id: id,
      subject_code: match ? match.subject_code : '',
      subject_name: match ? match.subject_name : '',
      room_id: !f.room_id && lastRoomIdForSubject ? lastRoomIdForSubject : f.room_id,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // subject_code/subject_name are only kept in form state for display - the backend
    // only wants subject_id now that a subject must already exist in the catalog.
    const { subject_code: _subjectCode, subject_name: _subjectName, ...rest } = form;
    const payload = {
      ...rest,
      education_level: effectiveContext.education_level,
      level: effectiveContext.level,
      year: effectiveContext.year,
      strand: effectiveContext.strand,
      section: effectiveContext.section,
    };

    const request = isEditing
      ? api.put(`/schedule/${schedule.schedule_id}`, payload)
      : api.post('/schedule', payload);

    request
      .then((res) => {
        onSaved(res.data);
        onClose();
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to save changes.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-gray-900 mb-1">{isEditing ? 'Edit Class Schedule' : 'Add New Class'}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {isEditing ? `Updating ${schedule.subject_code} on ${schedule.day}.` : 'Create a new class schedule entry.'}
        </p>

        <div className="bg-[#80172B]/5 border border-[#80172B]/20 rounded-lg p-3 mb-5">
          <p className="text-[10px] font-bold text-gray-400 uppercase">
            {isEditing ? 'Belongs to' : 'Adding class to'}
          </p>
          <p className="text-sm font-bold text-[#80172B] mt-0.5">{contextLabel || 'No timetable context'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase">Subject</label>
            {subjectOptions.length === 0 ? (
              <div className="mt-1 border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50">
                <p className="text-xs text-gray-500">
                  No subjects are set up yet for {contextLabel || 'this section'}. Add one from Manage Subjects first.
                </p>
                {onOpenManageSubjects && (
                  <button
                    type="button"
                    onClick={onOpenManageSubjects}
                    className="text-xs font-semibold text-[#80172B] hover:underline mt-1"
                  >
                    Open Manage Subjects
                  </button>
                )}
              </div>
            ) : (
              <select
                value={form.subject_id}
                onChange={handleSubjectSelect}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
              >
                <option value="" disabled>Select subject</option>
                {subjectOptions.map((s) => (
                  <option key={s.subject_id} value={s.subject_id}>{s.subject_code} — {s.subject_name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase">Faculty (Teacher / Instructor)</label>
            <select
              value={form.faculty_id}
              onChange={update('faculty_id')}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
            >
              <option value="" disabled>Select faculty</option>
              {availableFaculties.map((f) => (
                <option key={f.faculty_id} value={f.faculty_id}>{f.name} — {f.position}</option>
              ))}
            </select>
            {availableFaculties.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No faculty is tagged to teach {requiredGrade ? `${requiredTeachingLevel} ${requiredGrade}` : requiredTeachingLevel || 'this level'} yet. Set a teacher's teaching levels/grades from Edit Teacher.
              </p>
            )}

            {form.faculty_id && (
              <div className="mt-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                <p className="text-[11px] font-semibold text-gray-400 uppercase mb-2">
                  {selectedFaculty?.name || 'Selected teacher'}&rsquo;s current schedule
                </p>
                {facultySchedule.length === 0 ? (
                  <p className="text-xs text-gray-500">No classes currently assigned.</p>
                ) : (
                  <ul className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {facultySchedule.map((s) => (
                      <li key={s.schedule_id} className="text-xs text-gray-600 flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-700 w-20 shrink-0">{s.day}</span>
                        <span className="shrink-0">{to12Hour(s.start_time)}-{to12Hour(s.end_time)}</span>
                        <span className="text-gray-500 truncate text-right">{s.subject_code} &middot; {s.room}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase">Day</label>
              <select
                value={form.day}
                onChange={update('day')}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
              >
                {(effectiveContext.education_level === 'Basic Ed' ? DAYS : SCHEDULE_DAYS).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase">Room</label>
              <RoomCombobox
                rooms={rooms}
                value={form.room_id}
                onSelect={(roomId) => setForm((f) => ({ ...f, room_id: roomId }))}
                onOpenManageRooms={onOpenManageRooms}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase">Start Time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={update('start_time')}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase">End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={update('end_time')}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
              />
            </div>
          </div>

          {facultyConflict && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Heads up: {selectedFaculty?.name} already has {facultyConflict.subject_code} on {form.day} from{' '}
                {to12Hour(facultyConflict.start_time)}-{to12Hour(facultyConflict.end_time)} in {facultyConflict.room}.
                This will double-book them.
              </p>
            </div>
          )}

          {roomConflict && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Heads up: Room {roomConflict.room} is already booked for {roomConflict.subject_code}
                {roomConflict.faculty && <> ({roomConflict.faculty.name})</>} on {form.day} from{' '}
                {to12Hour(roomConflict.start_time)}-{to12Hour(roomConflict.end_time)}.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 bg-[#80172B] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#651020] transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
