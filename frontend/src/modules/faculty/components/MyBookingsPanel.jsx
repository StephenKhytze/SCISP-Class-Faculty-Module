import { useEffect, useState } from 'react';
import { Inbox } from 'lucide-react';
import api from '../../../services/api';
import BookingStatCards from './BookingStatCards';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_STYLES } from '../constants';
import { to12Hour } from '../officeHours';

export default function MyBookingsPanel() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/consultations/me')
      .then((res) => setBookings(res.data))
      .catch(() => setError('Unable to load your consultation bookings.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading your consultation bookings...</p>;
  if (error) return <p className="text-sm text-rose-600">{error}</p>;

  return (
    <div>
      <BookingStatCards bookings={bookings} />

      {bookings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">You haven&rsquo;t requested any consultations yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.consultation_id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold text-gray-900">{b.faculty?.name || 'Unknown Faculty'}</p>
                <p className="text-xs text-gray-500">
                  {b.faculty?.position}
                  {b.faculty?.department && <> &middot; {b.faculty.department}</>}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(b.consultation_date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  &middot; {to12Hour(b.consultation_time)}
                </p>
              </div>
              <span
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full border shrink-0 ${BOOKING_STATUS_STYLES[b.status]}`}
              >
                {BOOKING_STATUS_LABELS[b.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
