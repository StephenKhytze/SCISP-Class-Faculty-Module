import { useEffect, useState } from 'react';
import { ClipboardList, CalendarDays } from 'lucide-react';
import api from '../../../services/api';
import BookingStatCards from './BookingStatCards';
import BookingRequestsQueue from './BookingRequestsQueue';
import BookingMonthlyCalendar from './BookingMonthlyCalendar';

export default function TeacherBookingsDashboard() {
  const [faculty, setFaculty] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subTab, setSubTab] = useState('calendar');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api
      .get('/faculty/me')
      .then((res) => res.data)
      .catch(() => api.get('/faculty').then((res) => res.data.find((f) => f.user_id) ?? null))
      .then((facultyData) => {
        setFaculty(facultyData);
        return facultyData ? api.get(`/faculty/${facultyData.id}/bookings`) : null;
      })
      .then((res) => res && setBookings(res.data))
      .catch(() => setError('Unable to load consultation bookings.'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = (bookingId, status) => {
    api
      .patch(`/bookings/${bookingId}`, { status })
      .then((res) => setBookings((prev) => prev.map((b) => (b.id === bookingId ? res.data : b))))
      .catch(() => setError('Unable to update that booking.'));
  };

  if (loading) return <p className="text-sm text-gray-500">Loading your consultation bookings...</p>;
  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!faculty) return <p className="text-sm text-gray-500">No faculty profile is linked to your account yet.</p>;

  return (
    <div>
      <BookingStatCards bookings={bookings} />

      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setSubTab('queue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            subTab === 'queue' ? 'bg-[#80172B] text-white' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Requests Queue
        </button>
        <button
          onClick={() => setSubTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            subTab === 'calendar' ? 'bg-[#80172B] text-white' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Monthly Calendar
        </button>
      </div>

      {subTab === 'queue' ? (
        <BookingRequestsQueue bookings={bookings} onUpdateStatus={updateStatus} />
      ) : (
        <BookingMonthlyCalendar bookings={bookings} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} />
      )}
    </div>
  );
}
