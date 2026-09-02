import { X, MapPin, Mail, Clock, UserRound } from 'lucide-react';

export default function InstructorProfileModal({ faculty, onClose }) {
  if (!faculty) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-5">
          {faculty.faculty_image ? (
            <img src={faculty.faculty_image} alt={faculty.name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#80172B]/10 flex items-center justify-center">
              <UserRound className="w-8 h-8 text-[#80172B]" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900">{faculty.name}</h2>
            <p className="text-sm font-semibold text-[#80172B]">{faculty.position}</p>
            <p className="text-xs text-gray-500">{faculty.department}</p>
          </div>
        </div>

        <div className="space-y-2.5 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            {faculty.building}, {faculty.room}
            {faculty.local_ext && <> · Ext: {faculty.local_ext}</>}
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
            {faculty.email_address}
          </div>
          {faculty.office_hours && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-amber-700 font-medium">Hours: {faculty.office_hours}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
