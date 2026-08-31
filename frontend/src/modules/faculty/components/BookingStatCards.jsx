import { CalendarRange, Clock, CheckCircle2, UserCheck } from 'lucide-react';

export default function BookingStatCards({ bookings }) {
  const total = bookings.length;
  const pending = bookings.filter((b) => b.status === 'pending').length;
  const approved = bookings.filter((b) => b.status === 'approved').length;
  const completed = bookings.filter((b) => b.status === 'completed').length;

  const cards = [
    { label: 'Total Bookings', value: total, icon: CalendarRange, tone: 'bg-white border-gray-200 text-gray-700' },
    { label: 'Pending Review', value: pending, icon: Clock, tone: 'bg-amber-50 border-amber-200 text-amber-700' },
    { label: 'Approved Slots', value: approved, icon: CheckCircle2, tone: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { label: 'Completed Sessions', value: completed, icon: UserCheck, tone: 'bg-white border-gray-200 text-gray-700' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className={`border rounded-xl p-4 flex items-center justify-between ${tone}`}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{label}</p>
            <p className="text-2xl font-extrabold">{value}</p>
          </div>
          <Icon className="w-6 h-6 opacity-60" />
        </div>
      ))}
    </div>
  );
}
