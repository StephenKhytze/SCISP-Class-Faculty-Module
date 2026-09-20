import { useEffect, useMemo, useState } from 'react';
import { X, CalendarPlus, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';
import WeeklyScheduleBookingsGrid from './WeeklyScheduleBookingsGrid';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const BOOKED_STATUSES = ['pending', 'approved'];

export default function BookingRequestModal({ faculty, onClose }) {
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  }, []);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [facultySchedule, setFacultySchedule] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);

  useEffect(() => {
    if (!faculty) return;
    api
      .get('/schedule')
      .then((res) => setFacultySchedule(res.data.filter((s) => String(s.faculty_id) === String(faculty.faculty_id))))
      .catch(() => setFacultySchedule([]));
    api
      .get(`/faculty/${faculty.faculty_id}/consultations`)
      .then((res) => setExistingBookings(res.data.filter((b) => BOOKED_STATUSES.includes(b.status))))
      .catch(() => setExistingBookings([]));
  }, [faculty]);

  const selectedDayName = date ? DAY_NAMES[new Date(`${date}T00:00:00`).getDay()] : null;

  const classConflict = useMemo(() => {
    if (!selectedDayName || !time) return null;
    return facultySchedule.find((s) => s.day === selectedDayName && time >= s.start_time && time < s.end_time) || null;
  }, [facultySchedule, selectedDayName, time]);

  const bookingConflict = useMemo(() => {
    if (!date || !time) return null;
    return existingBookings.find((b) => b.consultation_date === date && b.consultation_time?.slice(0, 5) === time) || null;
  }, [existingBookings, date, time]);

  const conflict = classConflict || bookingConflict;

  const visibleBookings = useMemo(() => existingBookings.filter((b) => b.status === 'approved'), [existingBookings]);

  if (!faculty) return null;

  const resetAndClose = () => {
    setDate('');
    setTime('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    api
      .post(`/faculty/${faculty.faculty_id}/consultations`, {
        consultation_date: date,
        consultation_time: time,
        student_name: currentUser?.name,
      })
      .then(() => setSuccess(true))
      .catch((err) => setError(err.response?.data?.message || 'Unable to submit your booking request.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={resetAndClose}>
      <div
        className={`bg-white rounded-xl w-full p-6 relative max-h-[90vh] overflow-y-auto ${success ? 'max-w-md' : 'max-w-4xl'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={resetAndClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-gray-900 mb-1">Request Consultation</h2>
        <p className="text-sm text-gray-500 mb-5">
          with {faculty.name} &middot; {faculty.position}
        </p>

        {success ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-900">Request sent!</p>
            <p className="text-xs text-gray-500 mt-1">
              Your consultation request is pending faculty approval.
            </p>
            <button
              onClick={resetAndClose}
              className="mt-5 bg-[#80172B] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#651020] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase mb-2">
                {faculty.name}&rsquo;s weekly schedule
              </p>
              <WeeklyScheduleBookingsGrid
                schedule={facultySchedule}
                bookings={visibleBookings}
                officeHoursText={faculty.office_hours}
                studentPrivacyMode
                viewerName={currentUser?.name}
              />
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase">Preferred Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase">Preferred Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
                  />
                </div>
              </div>

              {conflict && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    {classConflict
                      ? `Heads up: ${faculty.name} usually has ${classConflict.subject_code} class at that time. Consider picking another slot.`
                      : 'Heads up: that exact slot already has a pending or approved request. Consider picking another time.'}
                  </p>
                </div>
              )}

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-1.5 bg-[#80172B] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[#651020] transition-colors disabled:opacity-60"
              >
                <CalendarPlus className="w-4 h-4" />
                {submitting ? 'Submitting...' : conflict ? 'Submit Anyway' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
