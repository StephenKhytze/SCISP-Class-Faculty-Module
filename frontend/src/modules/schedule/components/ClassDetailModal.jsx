import { X, MapPin, Clock, GraduationCap, UserRound } from 'lucide-react';

export default function ClassDetailModal({ entry, onClose, onViewInstructor, hideInstructorLink = false }) {
  if (!entry) return null;

  const scope = [entry.level, entry.year, entry.section].filter(Boolean).join(' · ');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-sm w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <p className="text-[11px] font-semibold text-gray-400 uppercase mb-1">Class Details</p>
        <h2 className="text-lg font-bold text-[#80172B]">{entry.subject_code}</h2>
        <p className="text-sm text-gray-600 mb-5">{entry.subject_name}</p>

        <div className="space-y-2.5 text-sm text-gray-700">
          {scope && (
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-gray-400 shrink-0" />
              {scope}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
            {entry.day} &middot; {entry.start_time} - {entry.end_time}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            {entry.room}
          </div>
          {entry.faculty && (
            <div className="flex items-center gap-2">
              <UserRound className="w-4 h-4 text-gray-400 shrink-0" />
              {entry.faculty.name}
            </div>
          )}
        </div>

        {entry.faculty && !hideInstructorLink && (
          <button
            onClick={() => onViewInstructor(entry.faculty)}
            className="w-full mt-5 bg-[#80172B] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[#651020] transition-colors"
          >
            View Instructor Profile
          </button>
        )}
      </div>
    </div>
  );
}
