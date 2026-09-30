import { useState } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../../services/api';

// Shared by three entry points: "Add Year Level" (mode="year" - only asks for the year
// label, section left blank), "Add Section" (mode="section" - year is already known from
// context, only asks for the section name), and "Add Strand" (mode="strand" - SHS only,
// brings back a strand that was previously archived; `strandOptions` is the list of names
// currently hidden from the picker, passed in by the caller). All three just create (or,
// for a previously-archived row, restore) one class_sections row.
export default function AddClassSectionModal({ open, mode, context, strandOptions = [], onClose, onSaved }) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const close = () => {
    setValue('');
    setError(null);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload =
      mode === 'year'
        ? { ...context, year_label: value }
        : mode === 'strand'
        ? { ...context, strand: value }
        : { ...context, section_name: value };

    api
      .post('/class-sections', payload)
      .then((res) => {
        onSaved(res.data);
        close();
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to save that.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={close}>
      <div className="bg-white rounded-xl max-w-sm w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 mb-5">
          {mode === 'year' ? 'Add Year Level' : mode === 'strand' ? 'Add Strand' : 'Add Section'}
        </h2>

        {mode === 'strand' && strandOptions.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">All strands are already showing for this grade. Archive one first to bring it back later.</p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={close}
                className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase">
                {mode === 'year' ? 'Year Level' : mode === 'strand' ? 'Strand' : 'Section Name'}
              </label>
              {mode === 'strand' ? (
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30 bg-white"
                >
                  <option value="" disabled>Select a strand</option>
                  {strandOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  placeholder={mode === 'year' ? 'e.g. 3rd Year' : 'e.g. C'}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
                />
              )}
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
        )}
      </div>
    </div>
  );
}
