import { AlertTriangle } from 'lucide-react';

export default function ScheduleCell({ entries, onSelectInstructor }) {
  if (!entries || entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {entries.map((entry) => (
        <button
          key={entry.schedule_id}
          onClick={() => entry.faculty && onSelectInstructor(entry.faculty)}
          className={`text-left rounded-lg p-2 text-xs transition-colors ${
            entry.hasConflict
              ? 'bg-rose-50 border border-rose-300 hover:bg-rose-100'
              : 'bg-[#80172B]/5 border border-[#80172B]/20 hover:bg-[#80172B]/10'
          }`}
        >
          <div className="flex items-center gap-1 font-bold text-[#80172B]">
            {entry.hasConflict && <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />}
            {entry.subject_code}
          </div>
          <div className="text-gray-600 truncate">{entry.subject_name}</div>
          <div className="text-gray-400">{entry.room}</div>
          {entry.faculty && <div className="text-gray-500 truncate">{entry.faculty.name}</div>}
        </button>
      ))}
    </div>
  );
}
