import { AlertTriangle, Pencil, Archive } from 'lucide-react';

export default function ScheduleCell({ entries, onSelectEntry, isAdmin = false, onEdit, onArchive }) {
  if (!entries || entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5 sm:gap-1.5">
      {entries.map((entry) => (
        <div
          key={entry.schedule_id}
          className={`rounded sm:rounded-lg p-0.5 sm:p-2 text-[8px] sm:text-xs transition-colors overflow-hidden ${
            entry.hasConflict
              ? 'bg-rose-50 border border-rose-300 hover:bg-rose-100'
              : 'bg-[#80172B]/5 border border-[#80172B]/20 hover:bg-[#80172B]/10'
          }`}
        >
          <div className="flex items-start gap-1">
            <button
              onClick={() => onSelectEntry(entry)}
              className="text-left flex-1 min-w-0"
            >
              {entry.hasConflict && (
                <div
                  className="flex items-center gap-1 mb-1 text-rose-700"
                  title={`Room conflict with ${entry.conflicts
                    .map((c) => `${c.subject_code}${[c.level, c.year].filter(Boolean).length ? ` (${[c.level, c.year].filter(Boolean).join(' ')})` : ''}`)
                    .join(', ')} — same room, overlapping time.`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 hidden sm:block" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wide hidden sm:inline">Conflict</span>
                  <span className="sm:hidden font-extrabold">⚠</span>
                </div>
              )}
              <div className="font-bold text-[#80172B] break-words">{entry.subject_code}</div>
              <div className="hidden sm:block text-gray-600 break-words">{entry.subject_name}</div>
              <div className="text-gray-400 break-words">{entry.room}</div>
              {entry.faculty && <div className="hidden sm:block text-gray-500 break-words">{entry.faculty.name}</div>}
            </button>

            {isAdmin && (
              <div className="flex flex-col gap-0.5 shrink-0 print:hidden">
                <button
                  onClick={() => onEdit(entry)}
                  title="Edit class"
                  className="text-gray-400 hover:text-[#80172B] transition-colors p-0.5"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onArchive(entry)}
                  title="Archive class"
                  className="text-gray-400 hover:text-amber-600 transition-colors p-0.5"
                >
                  <Archive className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
