import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_STYLES, BOOKING_CHIP_STYLES } from '../constants';

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function BookingMonthlyCalendar({ bookings, statusFilter, onStatusFilterChange }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  const filteredBookings = useMemo(
    () => bookings.filter((b) => !statusFilter || b.status === statusFilter),
    [bookings, statusFilter]
  );

  const bookingsByDate = useMemo(() => {
    const map = {};
    for (const booking of filteredBookings) {
      (map[booking.consultation_date] ??= []).push(booking);
    }
    return map;
  }, [filteredBookings]);

  const gridDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstWeekday; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [visibleMonth]);

  const monthLabel = visibleMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const todayKey = toDateKey(new Date());
  const selectedBookings = selectedDateKey ? bookingsByDate[selectedDateKey] || [] : [];

  const changeMonth = (delta) => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    setSelectedDateKey(null);
  };

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-[#182848]">{monthLabel}</span>
            <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setVisibleMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
              className="text-xs font-semibold text-[#80172B] border border-[#80172B]/30 px-3 py-1.5 rounded-lg hover:bg-[#80172B]/5"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
            >
              <option value="">All Statuses</option>
              {Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-200">
          {WEEKDAY_LABELS.map((day) => (
            <div key={day} className="text-center text-[11px] font-bold text-gray-400 py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {gridDays.map((date, idx) => {
            if (!date) return <div key={idx} className="min-h-[92px] border-b border-r border-gray-100 bg-gray-50/50" />;

            const dateKey = toDateKey(date);
            const entries = bookingsByDate[dateKey] || [];
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDateKey;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDateKey(entries.length ? dateKey : null)}
                className={`min-h-[92px] border-b border-r border-gray-100 p-2 text-left align-top hover:bg-gray-50 transition-colors ${
                  isSelected ? 'ring-2 ring-inset ring-amber-400 bg-amber-50/40' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isToday ? 'bg-[#80172B] text-white w-5 h-5 rounded flex items-center justify-center' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </span>
                  {entries.length > 0 && (
                    <span className="text-[9px] font-bold bg-[#80172B]/10 text-[#80172B] px-1.5 py-0.5 rounded-full">
                      {entries.length} slot{entries.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {entries.slice(0, 2).map((entry) => (
                    <div key={entry.consultation_id} className={`text-[10px] font-semibold px-1.5 py-1 rounded truncate ${BOOKING_CHIP_STYLES[entry.status]}`}>
                      {entry.student_name}
                      <div className="font-normal opacity-80">{entry.consultation_time}</div>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDateKey && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-bold text-[#182848]">
              <CalendarDays className="w-4 h-4 text-[#80172B]" />
              Consultation Agenda for {new Date(selectedDateKey).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <button onClick={() => setSelectedDateKey(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {selectedBookings.map((booking) => (
              <div key={booking.consultation_id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{booking.student_name}</p>
                  <p className="text-xs text-gray-500">{booking.consultation_time}</p>
                </div>
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${BOOKING_STATUS_STYLES[booking.status]}`}>
                  {BOOKING_STATUS_LABELS[booking.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
