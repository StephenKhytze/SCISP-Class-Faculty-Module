import { useState } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../../services/api';

export default function AddCourseModal({ open, educationLevel, onClose, onSaved }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const close = () => {
    setCode('');
    setName('');
    setError(null);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    api
      .post('/courses', { education_level: educationLevel, code, name })
      .then((res) => {
        onSaved(res.data);
        close();
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to add that course.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={close}>
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Add {educationLevel === 'Masteral' ? 'Graduate Program' : 'Course'}
        </h2>
        <p className="text-sm text-gray-500 mb-5">Under {educationLevel}.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase">Code / Abbreviation</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="e.g. BSN"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Bachelor of Science in Nursing (BSN)"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={close}
              className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 bg-[#80172B] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#651020] transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Saving...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
