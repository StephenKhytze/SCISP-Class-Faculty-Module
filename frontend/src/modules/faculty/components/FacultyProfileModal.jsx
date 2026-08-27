import { X, MapPin, Mail, Clock, Tag, UserRound } from 'lucide-react';
import { STATUS_STYLES, STATUS_DOT, statusLabel } from '../constants';

export default function FacultyProfileModal({ faculty, onClose }) {
  if (!faculty) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-lg w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-5">
          {faculty.photo_url ? (
            <img src={faculty.photo_url} alt={faculty.name} className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#80172B]/10 flex items-center justify-center">
              <UserRound className="w-10 h-10 text-[#80172B]" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{faculty.name}</h2>
            <p className="text-sm font-semibold text-[#80172B]">{faculty.position}</p>
            <p className="text-xs text-gray-500">{faculty.college} &middot; {faculty.department}</p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border mb-5 ${STATUS_STYLES[faculty.availability_status]}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[faculty.availability_status]}`} />
          {statusLabel(faculty.availability_status, faculty.status_detail)}
        </span>

        <div className="space-y-3 text-sm text-gray-700 mb-5">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            {faculty.building}, {faculty.room}
            {faculty.local_ext && <> · Ext: {faculty.local_ext}</>}
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
            {faculty.email}
          </div>
          {faculty.office_hours && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-amber-700 font-medium">Hours: {faculty.office_hours}</span>
            </div>
          )}
        </div>

        {faculty.specializations?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase mb-1.5">
              <Tag className="w-3.5 h-3.5" />
              Specializations
            </div>
            <div className="flex flex-wrap gap-1.5">
              {faculty.specializations.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
