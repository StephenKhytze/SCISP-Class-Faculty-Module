import { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../../services/api';
import { STATUS_LABELS, STATUS_STYLES, STATUS_DOT, statusLabel } from '../constants';
import { DAY_OPTIONS, parseOfficeHours, formatOfficeHours } from '../officeHours';

const FIELD_DEFAULTS = {
  first_name: '',
  middle_name: '',
  last_name: '',
  department: '',
  email_address: '',
  position: '',
  college: '',
  building: '',
  room: '',
  local_ext: '',
  specializations: '',
  availability_status: 'available',
  status_detail: '',
};

export default function FacultyEditModal({ faculty, onClose, onSaved, selfEdit = false, liveAvailability }) {
  const [form, setForm] = useState(FIELD_DEFAULTS);
  const [officeDays, setOfficeDays] = useState([]);
  const [officeStart, setOfficeStart] = useState('');
  const [officeEnd, setOfficeEnd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isEditing = Boolean(faculty?.faculty_id);

  useEffect(() => {
    if (!faculty) return;
    setForm({
      first_name: faculty.first_name || '',
      middle_name: faculty.middle_name || '',
      last_name: faculty.last_name || '',
      department: faculty.department || '',
      email_address: faculty.email_address || '',
      position: faculty.position || '',
      college: faculty.college || '',
      building: faculty.building || '',
      room: faculty.room || '',
      local_ext: faculty.local_ext || '',
      specializations: (faculty.specializations || []).join(', '),
      availability_status: faculty.availability_status || 'available',
      status_detail: faculty.status_detail || '',
    });
    const parsed = parseOfficeHours(faculty.office_hours);
    setOfficeDays(parsed.days);
    setOfficeStart(parsed.start);
    setOfficeEnd(parsed.end);
    setError(null);
  }, [faculty]);

  if (!faculty) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggleDay = (day) =>
    setOfficeDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      ...form,
      office_hours: formatOfficeHours(officeDays, officeStart, officeEnd),
      specializations: form.specializations
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      ...(selfEdit && liveAvailability
        ? { availability_status: liveAvailability.status, status_detail: liveAvailability.detail }
        : {}),
    };

    const request = isEditing
      ? api.put(`/faculty/${faculty.faculty_id}`, payload)
      : api.post('/faculty', payload);

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
        className="bg-white rounded-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-gray-900 mb-1">
          {isEditing ? 'Edit Faculty Record' : 'Add Faculty Member'}
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          {isEditing ? `Updating ${faculty.name}’s directory profile.` : 'Create a new faculty directory profile.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="First Name" value={form.first_name} onChange={update('first_name')} required />
            <Field label="Middle Name" value={form.middle_name} onChange={update('middle_name')} />
            <Field label="Last Name" value={form.last_name} onChange={update('last_name')} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Position" value={form.position} onChange={update('position')} required />
            <Field label="Department" value={form.department} onChange={update('department')} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="College" value={form.college} onChange={update('college')} required />
            <Field label="Email Address" type="email" value={form.email_address} onChange={update('email_address')} required />
          </div>

          <div className={`grid grid-cols-1 gap-4 ${selfEdit ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            <Field label="Building" value={form.building} onChange={update('building')} required />
            <Field label="Room" value={form.room} onChange={update('room')} required />
            {!selfEdit && (
              <Field label="Local Ext." value={form.local_ext} onChange={update('local_ext')} />
            )}
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase">Office Hours</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {DAY_OPTIONS.map((day) => (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    officeDays.includes(day)
                      ? 'bg-[#80172B] text-white border-[#80172B]'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <input
                type="time"
                value={officeStart}
                onChange={(e) => setOfficeStart(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="time"
                value={officeEnd}
                onChange={(e) => setOfficeEnd(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
              />
              {officeDays.length > 0 && officeStart && officeEnd && (
                <span className="text-xs text-gray-500 ml-1">{formatOfficeHours(officeDays, officeStart, officeEnd)}</span>
              )}
            </div>
          </div>

          <Field label="Specializations" value={form.specializations} onChange={update('specializations')} placeholder="Comma-separated, e.g. Algorithms, Machine Learning" />

          {selfEdit ? (
            liveAvailability && (
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase">Availability Status</label>
                <div className="mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[liveAvailability.status]}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[liveAvailability.status]}`} />
                    {statusLabel(liveAvailability.status, liveAvailability.detail)}
                  </span>
                  <p className="text-xs text-gray-400 mt-1.5">Detected automatically from your class schedule.</p>
                </div>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase">Availability Status</label>
                <select
                  value={form.availability_status}
                  onChange={update('availability_status')}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <Field label="Status Detail" value={form.status_detail} onChange={update('status_detail')} placeholder="e.g. In Office" />
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
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Faculty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false, placeholder }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-400 uppercase">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
      />
    </div>
  );
}
