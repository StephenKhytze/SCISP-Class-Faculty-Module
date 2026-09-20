import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, LayoutGrid, Pencil } from 'lucide-react';
import api from '../../../services/api';
import BookingStatCards from './BookingStatCards';
import BookingRequestsQueue from './BookingRequestsQueue';
import WeeklyScheduleBookingsGrid from './WeeklyScheduleBookingsGrid';
import FacultyEditModal from './FacultyEditModal';
import { currentDayName, currentTimeHHMM } from '../../schedule/constants';
import { parseOfficeHoursFullDays } from '../officeHours';
import { STATUS_STYLES, STATUS_DOT, statusLabel } from '../constants';

export default function TeacherBookingsDashboard() {
  const [faculty, setFaculty] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subTab, setSubTab] = useState('queue');
  const [editingOwnProfile, setEditingOwnProfile] = useState(null);

  useEffect(() => {
    api
      .get('/faculty/me')
      .then((res) => res.data)
      .catch(() => api.get('/faculty').then((res) => res.data.find((f) => f.user_id) ?? null))
      .then((facultyData) => {
        setFaculty(facultyData);
        if (!facultyData) return null;
        return Promise.all([
          api.get(`/faculty/${facultyData.faculty_id}/consultations`).then((res) => res.data),
          api.get('/schedule').then((res) => res.data.filter((s) => String(s.faculty_id) === String(facultyData.faculty_id))),
        ]);
      })
      .then((results) => {
        if (!results) return;
        const [bookingData, scheduleData] = results;
        setBookings(bookingData);
        setSchedule(scheduleData);
      })
      .catch(() => setError('Unable to load consultation bookings.'))
      .finally(() => setLoading(false));
  }, []);

  const liveAvailability = useMemo(() => {
    const day = currentDayName();
    const time = currentTimeHHMM();
    const inClass = day && schedule.find((s) => s.day === day && s.start_time <= time && s.end_time > time);
    if (inClass) return { status: 'in_class', detail: inClass.subject_code };

    const office = parseOfficeHoursFullDays(faculty?.office_hours);
    const inOfficeHours = day && office.start && office.end && office.days.includes(day) && time >= office.start && time < office.end;
    return inOfficeHours ? { status: 'consultation_hours', detail: '' } : { status: 'off_campus', detail: '' };
  }, [schedule, faculty]);

  const updateStatus = (consultationId, status) => {
    api
      .patch(`/consultations/${consultationId}`, { status })
      .then((res) => setBookings((prev) => prev.map((b) => (b.consultation_id === consultationId ? res.data : b))))
      .catch(() => setError('Unable to update that booking.'));
  };

  if (loading) return <p className="text-sm text-gray-500">Loading consultation bookings...</p>;
  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!faculty) return <p className="text-sm text-gray-500">No faculty profile is linked to your account yet.</p>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{faculty.name}</h3>
          <p className="text-sm text-gray-500 mb-1.5">{faculty.position} &middot; {faculty.department}</p>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[liveAvailability.status]}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[liveAvailability.status]}`} />
            {statusLabel(liveAvailability.status, liveAvailability.detail)}
          </span>
        </div>
        <button
          onClick={() => setEditingOwnProfile(faculty)}
          className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
        >
          <Pencil className="w-4 h-4" />
          Edit My Profile
        </button>
      </div>

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
          onClick={() => setSubTab('grid')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            subTab === 'grid' ? 'bg-[#80172B] text-white' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Weekly Grid
        </button>
      </div>

      {subTab === 'queue' ? (
        <BookingRequestsQueue bookings={bookings} onUpdateStatus={updateStatus} />
      ) : (
        <WeeklyScheduleBookingsGrid schedule={schedule} bookings={bookings} onUpdateStatus={updateStatus} />
      )}

      <FacultyEditModal
        faculty={editingOwnProfile}
        onClose={() => setEditingOwnProfile(null)}
        onSaved={(saved) => setFaculty(saved)}
        selfEdit
        liveAvailability={liveAvailability}
      />
    </div>
  );
}
