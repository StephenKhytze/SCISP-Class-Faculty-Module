import { useState } from 'react';
import { MapPin, Mail, Clock, Tag, Copy, Check, UserRound, CalendarPlus, Pencil, Bell } from 'lucide-react';
import { STATUS_STYLES, STATUS_DOT, statusLabel } from '../constants';

export default function FacultyCard({
  faculty,
  onViewProfile,
  onBook,
  onEdit,
  onManageBookings,
  canBook = true,
  canEdit = false,
  pendingCount = 0,
}) {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(faculty.email_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
          {faculty.department}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[faculty.availability_status]}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[faculty.availability_status]}`} />
          {statusLabel(faculty.availability_status, faculty.status_detail)}
        </span>
      </div>

      {canEdit && pendingCount > 0 && (
        <button
          onClick={() => onManageBookings(faculty)}
          className="w-full flex items-center justify-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold py-1.5 rounded-lg mb-3 hover:bg-amber-100 transition-colors"
        >
          <Bell className="w-3.5 h-3.5" />
          {pendingCount} pending booking{pendingCount > 1 ? 's' : ''} &middot; Review now
        </button>
      )}

      <div className="flex items-center gap-3 mb-4">
        {faculty.faculty_image ? (
          <img src={faculty.faculty_image} alt={faculty.name} className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#80172B]/10 flex items-center justify-center">
            <UserRound className="w-7 h-7 text-[#80172B]" />
          </div>
        )}
        <div>
          <h3 className="font-bold text-gray-900 leading-tight">{faculty.name}</h3>
          <p className="text-sm font-semibold text-[#80172B]">{faculty.position}</p>
          <p className="text-xs text-gray-500">{faculty.college}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
          <span>
            {faculty.building}, {faculty.room}
            {faculty.local_ext && <> · Ext: {faculty.local_ext}</>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="truncate">{faculty.email_address}</span>
          <button
            onClick={copyEmail}
            className="text-gray-400 hover:text-[#80172B] transition-colors shrink-0"
            title="Copy email"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        {faculty.office_hours && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-amber-700 font-medium">Hours: {faculty.office_hours}</span>
          </div>
        )}
      </div>

      {faculty.specializations?.length > 0 && (
        <div className="mb-5">
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

      <div className="mt-auto flex gap-2">
        <button
          onClick={() => onViewProfile(faculty)}
          className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <UserRound className="w-4 h-4" />
          View Profile
        </button>
        {canEdit ? (
          <button
            onClick={() => onEdit(faculty)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#80172B] text-white text-sm font-medium py-2 rounded-lg hover:bg-[#651020] transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
        ) : (
          canBook && (
            <button
              onClick={() => onBook(faculty)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#80172B] text-white text-sm font-medium py-2 rounded-lg hover:bg-[#651020] transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              Book
            </button>
          )
        )}
      </div>
    </div>
  );
}
