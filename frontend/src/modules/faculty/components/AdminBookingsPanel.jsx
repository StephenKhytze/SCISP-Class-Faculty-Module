import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Inbox, UserRound, ArrowLeft, Search, ListChecks } from 'lucide-react';
import api from '../../../services/api';
import BookingStatCards from './BookingStatCards';
import { to12Hour } from '../officeHours';

export default function AdminBookingsPanel({ onBookingChanged }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null); // null | 'all' | faculty_id
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get('/consultations')
      .then((res) => setBookings(res.data))
      .catch(() => setError('Unable to load consultation bookings.'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = (consultationId, status) => {
    api
      .patch(`/consultations/${consultationId}`, { status })
      .then((res) => {
        setBookings((prev) => prev.map((b) => (b.consultation_id === consultationId ? { ...b, ...res.data } : b)));
        onBookingChanged?.();
      })
      .catch(() => setError('Unable to update that booking.'));
  };

  const teacherGroups = useMemo(() => {
    const map = new Map();
    bookings.forEach((b) => {
      if (!b.faculty) return;
      if (!map.has(b.faculty_id)) map.set(b.faculty_id, { faculty: b.faculty, all: [], pending: [] });
      const group = map.get(b.faculty_id);
      group.all.push(b);
      if (b.status === 'pending') group.pending.push(b);
    });
    return [...map.values()].sort(
      (a, b) => b.pending.length - a.pending.length || a.faculty.name.localeCompare(b.faculty.name)
    );
  }, [bookings]);

  const filteredTeacherGroups = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return teacherGroups;
    return teacherGroups.filter((g) => `${g.faculty.name} ${g.faculty.department}`.toLowerCase().includes(keyword));
  }, [teacherGroups, search]);

  const allPending = useMemo(() => bookings.filter((b) => b.status === 'pending'), [bookings]);

  const isAllView = selectedTeacherId === 'all';
  const selectedGroup = isAllView
    ? null
    : teacherGroups.find((g) => String(g.faculty.faculty_id) === String(selectedTeacherId)) || null;
  const showingDetail = isAllView || Boolean(selectedGroup);

  if (loading) return <p className="text-sm text-gray-500">Loading consultation bookings...</p>;
  if (error) return <p className="text-sm text-rose-600">{error}</p>;

  return (
    <div>
      <BookingStatCards bookings={selectedGroup ? selectedGroup.all : bookings} />

      {!showingDetail ? (
        teacherGroups.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No consultation bookings have been made yet.</p>
          </div>
        ) : (
          <>
            {allPending.length > 0 && (
              <button
                onClick={() => setSelectedTeacherId('all')}
                className="w-full flex items-center justify-between gap-3 bg-[#80172B]/5 border border-[#80172B]/20 rounded-xl p-4 mb-5 hover:bg-[#80172B]/10 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-[#80172B]/10 flex items-center justify-center shrink-0">
                    <ListChecks className="w-6 h-6 text-[#80172B]" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-gray-900 text-sm">View All Pending Requests</p>
                    <p className="text-xs text-gray-500">See every teacher&rsquo;s requests together in one combined list</p>
                  </div>
                </div>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                  {allPending.length} pending
                </span>
              </button>
            )}

            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900">Select a Teacher</h3>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search teacher..."
                  className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
                />
              </div>
            </div>

            {filteredTeacherGroups.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No teachers match your search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeacherGroups.map(({ faculty, all, pending }) => (
                  <button
                    key={faculty.faculty_id}
                    onClick={() => setSelectedTeacherId(faculty.faculty_id)}
                    className="text-left bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:border-[#80172B] hover:shadow-md transition-all"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#80172B]/10 flex items-center justify-center shrink-0">
                      <UserRound className="w-6 h-6 text-[#80172B]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 text-sm truncate">{faculty.name}</p>
                      <p className="text-xs text-gray-500 truncate">{faculty.department}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {all.length} total booking{all.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {pending.length > 0 && (
                      <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                        {pending.length} pending
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )
      ) : (
        <div>
          <button
            onClick={() => setSelectedTeacherId(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#80172B] hover:underline mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to All Teachers
          </button>

          {isAllView ? (
            <h3 className="text-sm font-bold text-gray-900 mb-4">All Pending Requests</h3>
          ) : (
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#80172B]/10 flex items-center justify-center shrink-0">
                <UserRound className="w-5 h-5 text-[#80172B]" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{selectedGroup.faculty.name}</p>
                <p className="text-xs text-gray-500">{selectedGroup.faculty.department}</p>
              </div>
            </div>
          )}

          {(isAllView ? allPending : selectedGroup.pending).length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
              <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {isAllView ? 'No pending consultation requests right now.' : 'No pending consultation requests for this teacher right now.'}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm">
              {(isAllView ? allPending : selectedGroup.pending).map((booking) => (
                <div key={booking.consultation_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm break-words">{booking.student_name}</p>
                    {isAllView && booking.faculty && (
                      <p className="text-xs text-[#80172B] font-medium break-words">for {booking.faculty.name}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(booking.consultation_date).toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      &middot; {to12Hour(booking.consultation_time)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => updateStatus(booking.consultation_id, 'approved')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(booking.consultation_id, 'declined')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 border border-rose-300 text-rose-700 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
