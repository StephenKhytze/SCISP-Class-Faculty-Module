import { useState } from 'react';
import { X, CalendarPlus, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';

export default function BookingRequestModal({ faculty, onClose }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!faculty) return null;

  const resetAndClose = () => {
    setDate('');
    setTime('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    let currentUser = null;
    try {
      currentUser = JSON.parse(localStorage.getItem('user'));
    } catch {
      currentUser = null;
    }

    api
      .post(`/faculty/${faculty.faculty_id}/consultations`, {
        consultation_date: date,
        consultation_time: time,
        student_name: currentUser?.name,
      })
      .then(() => setSuccess(true))
      .catch((err) => setError(err.response?.data?.message || 'Unable to submit your booking request.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={resetAndClose}>
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={resetAndClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-gray-900 mb-1">Request Consultation</h2>
        <p className="text-sm text-gray-500 mb-5">
          with {faculty.name} &middot; {faculty.position}
        </p>

        {success ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-900">Request sent!</p>
            <p className="text-xs text-gray-500 mt-1">
              Your consultation request is pending faculty approval.
            </p>
            <button
              onClick={resetAndClose}
              className="mt-5 bg-[#80172B] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#651020] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase">Preferred Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase">Preferred Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
              />
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-1.5 bg-[#80172B] text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-[#651020] transition-colors disabled:opacity-60"
            >
              <CalendarPlus className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
