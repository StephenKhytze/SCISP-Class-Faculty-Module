import { useEffect, useMemo, useState } from 'react';
import { X, ClipboardList, LayoutGrid } from 'lucide-react';
import api from '../../../services/api';
import BookingRequestsQueue from './BookingRequestsQueue';
import WeeklyScheduleBookingsGrid from './WeeklyScheduleBookingsGrid';

export default function FacultyScheduleModal({ faculty, onClose }) {
  const [schedule, setSchedule] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subTab, setSubTab] = useState('queue');

  useEffect(() => {
    if (!faculty) return;
    setLoading(true);
    setError(null);
    setSubTab('queue');
    Promise.all([
      api.get('/schedule').then((res) => res.data.filter((s) => String(s.faculty_id) === String(faculty.faculty_id))),
      api.get(`/faculty/${faculty.faculty_id}/consultations`).then((res) => res.data),
    ])
      .then(([scheduleData, bookingData]) => {
        setSchedule(scheduleData);
        setBookings(bookingData);
      })
      .catch(() => setError('Unable to load this faculty member’s schedule and bookings.'))
      .finally(() => setLoading(false));
  }, [faculty]);

  const pendingCount = useMemo(() => bookings.filter((b) => b.status === 'pending').length, [bookings]);

  useEffect(() => {
    if (!loading) setSubTab(pendingCount > 0 ? 'queue' : 'grid');
  }, [loading, pendingCount]);

  if (!faculty) return null;

  const updateStatus = (consultationId, status) => {
    api
      .patch(`/consultations/${consultationId}`, { status })
      .then((res) => setBookings((prev) => prev.map((b) => (b.consultation_id === consultationId ? res.data : b))))
      .catch(() => setError('Unable to update that booking.'));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-5xl w-full p-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-gray-900 mb-1">Schedule &amp; Consultation Bookings</h2>
        <p className="text-sm text-gray-500 mb-4">
          {faculty.name} &middot; {faculty.position}
        </p>

        {!loading && !error && (
          <div className="flex items-center gap-2 mb-5">
            <button
              onClick={() => setSubTab('queue')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                subTab === 'queue' ? 'bg-[#80172B] text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Requests Queue
              {pendingCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    subTab === 'queue' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setSubTab('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                subTab === 'grid' ? 'bg-[#80172B] text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Weekly Grid
            </button>
          </div>
        )}

        {loading && <p className="text-sm text-gray-500">Loading schedule...</p>}
        {error && <p className="text-sm text-rose-600">{error}</p>}

        {!loading && !error && subTab === 'queue' && (
          <BookingRequestsQueue bookings={bookings} onUpdateStatus={updateStatus} />
        )}

        {!loading && !error && subTab === 'grid' && (
          <WeeklyScheduleBookingsGrid schedule={schedule} bookings={bookings} onUpdateStatus={updateStatus} />
        )}
      </div>
    </div>
  );
}
