import { CheckCircle2, XCircle, Inbox } from 'lucide-react';
import { BOOKING_STATUS_STYLES, BOOKING_STATUS_LABELS } from '../constants';
import { to12Hour } from '../officeHours';

export default function BookingRequestsQueue({ bookings, onUpdateStatus }) {
  const pending = bookings.filter((b) => b.status === 'pending');

  if (pending.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
        <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No pending consultation requests right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((booking) => (
        <div key={booking.consultation_id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 break-words">{booking.student_name}</p>
            {booking.faculty && <p className="text-xs text-[#80172B] font-medium break-words">for {booking.faculty.name}</p>}
            <p className="text-xs text-gray-500">
              {new Date(booking.consultation_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-xs text-gray-500">{to12Hour(booking.consultation_time)}</p>
            <span className={`inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${BOOKING_STATUS_STYLES[booking.status]}`}>
              {BOOKING_STATUS_LABELS[booking.status]}
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onUpdateStatus(booking.consultation_id, 'approved')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => onUpdateStatus(booking.consultation_id, 'declined')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 border border-rose-300 text-rose-700 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
