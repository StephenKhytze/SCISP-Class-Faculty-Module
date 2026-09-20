import { CalendarDays, Check, X as XIcon } from 'lucide-react';
import { DAYS, TIME_SLOTS } from '../../schedule/constants';
import { parseOfficeHoursFullDays, to12Hour } from '../officeHours';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const BOOKING_STYLES = {
  pending: 'bg-amber-50 border-amber-300',
  approved: 'bg-emerald-50 border-emerald-300',
  declined: 'bg-rose-50 border-rose-300',
  completed: 'bg-sky-50 border-sky-300',
};

const BOOKING_TEXT = {
  pending: 'text-amber-700',
  approved: 'text-emerald-700',
  declined: 'text-rose-700',
  completed: 'text-sky-700',
};

export default function WeeklyScheduleBookingsGrid({ schedule, bookings, onUpdateStatus, officeHoursText }) {
  const officeHours = officeHoursText ? parseOfficeHoursFullDays(officeHoursText) : null;
  const statusesPresent = new Set(bookings.map((b) => b.status));

  const classesFor = (day, slot) =>
    schedule.filter((s) => s.day === day && s.start_time < slot.end && s.end_time > slot.start);

  const bookingsFor = (day, slot) =>
    bookings.filter((b) => {
      const weekday = WEEKDAY_NAMES[new Date(`${b.consultation_date}T00:00:00`).getDay()];
      const time = b.consultation_time?.slice(0, 5);
      return weekday === day && time >= slot.start && time < slot.end;
    });

  const isOfficeHours = (day, slot) => {
    if (!officeHours || !officeHours.start || !officeHours.end || !officeHours.days.includes(day)) return false;
    return slot.start < officeHours.end && slot.end > officeHours.start;
  };

  const hasAnything = schedule.length > 0 || bookings.length > 0 || Boolean(officeHours?.days.length);

  if (!hasAnything) {
    return (
      <div className="text-center py-8">
        <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No classes or consultation bookings yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#80172B]/20 border border-[#80172B]/40" />
          Class
        </span>
        {officeHoursText && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-100 border border-sky-300" />
            Office hours (good time to request)
          </span>
        )}
        {statusesPresent.has('pending') && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300" />
            Pending booking
          </span>
        )}
        {statusesPresent.has('approved') && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300" />
            Approved booking
          </span>
        )}
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-bold text-gray-500 uppercase p-2 w-16">Time</th>
                {DAYS.map((day) => (
                  <th key={day} className="text-left text-xs font-bold text-gray-500 uppercase p-2 w-[125px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot) => (
                <tr key={slot.label} className="border-b border-gray-100 last:border-b-0">
                  <td className="p-2 text-xs font-bold text-gray-700 align-top">{slot.label}</td>
                  {DAYS.map((day) => (
                    <td
                      key={day}
                      className={`p-2 align-top border-l border-gray-100 ${isOfficeHours(day, slot) ? 'bg-sky-50/60' : ''}`}
                    >
                      <div className="flex flex-col gap-1.5">
                        {classesFor(day, slot).map((entry) => (
                          <div
                            key={`class-${entry.schedule_id}`}
                            className="rounded-lg p-2 text-xs bg-[#80172B]/5 border border-[#80172B]/20"
                          >
                            <div className="font-bold text-[#80172B] break-words">{entry.subject_code}</div>
                            <div className="text-gray-600 break-words">{entry.subject_name}</div>
                            <div className="text-gray-400 break-words">{entry.room}</div>
                          </div>
                        ))}
                        {bookingsFor(day, slot).map((b) => (
                          <div
                            key={`booking-${b.consultation_id}`}
                            className={`rounded-lg p-2 text-xs border ${BOOKING_STYLES[b.status]}`}
                          >
                            <div className={`font-bold break-words ${BOOKING_TEXT[b.status]}`}>{b.student_name}</div>
                            <div className="text-gray-500 break-words">{to12Hour(b.consultation_time)} &middot; {b.status}</div>
                            {b.status === 'pending' && onUpdateStatus && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <button
                                  onClick={() => onUpdateStatus(b.consultation_id, 'approved')}
                                  title="Accept"
                                  className="flex items-center justify-center w-5 h-5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => onUpdateStatus(b.consultation_id, 'declined')}
                                  title="Reject"
                                  className="flex items-center justify-center w-5 h-5 rounded bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors"
                                >
                                  <XIcon className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
