import { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../../services/api';
import { DAYS } from '../constants';

const FIELD_DEFAULTS = {
  subject_id: '',
  subject_code: '',
  subject_name: '',
  faculty_id: '',
  room: '',
  level: '',
  year: '',
  section: '',
  day: DAYS[0],
  start_time: '',
  end_time: '',
};

export default function ScheduleEditModal({ schedule, subjects = [], onClose, onSaved }) {
  const [form, setForm] = useState(FIELD_DEFAULTS);
  const [faculties, setFaculties] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = Boolean(schedule?.schedule_id);

  useEffect(() => {
    if (!schedule) return;
    setForm({
      subject_id: schedule.subject_id || '',
      subject_code: schedule.subject_code || '',
      subject_name: schedule.subject_name || '',
      faculty_id: schedule.faculty_id || '',
      room: schedule.room || '',
      level: schedule.level || '',
      year: schedule.year || '',
      section: schedule.section || '',
      day: schedule.day || DAYS[0],
      start_time: schedule.start_time || '',
      end_time: schedule.end_time || '',
    });
    setError(null);
  }, [schedule]);

  useEffect(() => {
    if (!schedule) return;
    api
      .get('/faculty')
      .then((res) => setFaculties(res.data))
      .catch(() => setFaculties([]));
  }, [schedule]);

  if (!schedule) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubjectCodeChange = (e) => {
    const code = e.target.value;
    const match = subjects.find((s) => s.subject_code.toLowerCase() === code.toLowerCase());
    setForm((f) => ({
      ...f,
      subject_code: code,
      subject_name: match ? match.subject_name : f.subject_name,
      subject_id: match ? match.subject_id : '',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { subject_id, subject_code, subject_name, ...rest } = form;
    const payload = subject_id
      ? { ...rest, subject_id }
      : { ...rest, new_subject_code: subject_code, new_subject_name: subject_name };

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
        <p className="text-sm text-gray-500 mb-5">
          {isEditing ? `Updating ${schedule.subject_code} on ${schedule.day}.` : 'Create a new class schedule entry.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase">Subject Code</label>
              <input
                list="subject-code-options"
                type="text"
                value={form.subject_code}
                onChange={handleSubjectCodeChange}
                required
                placeholder="Type new or pick existing"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
              />
              <datalist id="subject-code-options">
                {subjects.map((s) => (
                  <option key={s.subject_id} value={s.subject_code}>{s.subject_name}</option>
                ))}
              </datalist>
            </div>
            <Field
              label="Subject Name"
              value={form.subject_name}
              onChange={update('subject_name')}
              required
              placeholder="e.g. Integrative Programming & Technologies 2"
            />
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
              {faculties.map((f) => (
                <option key={f.faculty_id} value={f.faculty_id}>{f.name} — {f.position}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase">Day</label>
              <select
                value={form.day}
                onChange={update('day')}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <Field label="Room" value={form.room} onChange={update('room')} />
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Course" value={form.level} onChange={update('level')} placeholder="e.g. BSIT" />
            <Field label="Year Level" value={form.year} onChange={update('year')} placeholder="e.g. 3rd Year" />
            <Field label="Section" value={form.section} onChange={update('section')} placeholder="e.g. A" />
          </div>

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

function Field({ label, value, onChange, placeholder, required = false }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-400 uppercase">{label}</label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
      />
    </div>
  );
}
