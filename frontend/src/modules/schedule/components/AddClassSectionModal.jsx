import { useMemo, useState } from 'react';
import { X, Save, Plus } from 'lucide-react';
import api from '../../../services/api';

// Shared by "Add Year Level" (mode="year"), "Add Section" (mode="section"), and "Add Strand"
// (mode="strand"). Each field is an editable combobox: existing values are suggestions, and a
// new value can be typed and added. Duplicates are caught with a normalized comparison (trimmed,
// whitespace collapsed, case-insensitive) before saving, and the backend repeats the check.
const normalize = (v) => v.trim().replace(/\s+/g, ' ');
const sameValue = (a, b) => normalize(a).toLowerCase() === normalize(b).toLowerCase();

const LABELS = {
  year: { title: 'Add Year Level', field: 'Year Level', placeholder: 'Search or enter year level...', key: 'year_label' },
  section: { title: 'Add Section', field: 'Section Name', placeholder: 'Search or enter section...', key: 'section_name' },
  strand: { title: 'Add Strand', field: 'Strand', placeholder: 'Search or enter strand...', key: 'strand' },
};

export default function AddClassSectionModal({ open, mode, context, existingValues = [], archivedValues = [], onClose, onSaved }) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const label = LABELS[mode];
  const typed = normalize(value);

  const clash = useMemo(() => {
    if (!typed) return null;
    if (existingValues.some((v) => sameValue(v, typed))) return { kind: 'active', name: typed };
    if (archivedValues.some((v) => sameValue(v, typed))) return { kind: 'archived', name: typed };
    return null;
  }, [typed, existingValues, archivedValues]);

  const suggestions = useMemo(() => {
    const q = typed.toLowerCase();
    return existingValues.filter((v) => !q || v.toLowerCase().includes(q));
  }, [existingValues, typed]);

  if (!open || !label) return null;

  const clashMessage = (c) =>
    c.kind === 'active'
      ? `${c.name} already exists.`
      : `${c.name} already exists but is archived. Restore it from the archived list.`;

  const close = () => {
    setValue('');
    setError(null);
    setMenuOpen(false);
    onClose();
  };

  const pick = (name) => {
    setValue(name);
    setMenuOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (clash) {
      setError(clashMessage(clash));
      return;
    }
    setSubmitting(true);
    api
      .post('/class-sections', { ...context, [label.key]: typed })
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
        <h2 className="text-lg font-bold text-gray-900 mb-5">{label.title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase">{label.field}</label>
            <div className="relative mt-1">
              <input
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setMenuOpen(true);
                }}
                onFocus={() => setMenuOpen(true)}
                onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                required
                autoComplete="off"
                placeholder={label.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
              />
              {menuOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {suggestions.map((v) => (
                    <button
                      type="button"
                      key={v}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(v)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-[#80172B]/5"
                    >
                      {v}
                    </button>
                  ))}
                  {typed && !clash && !existingValues.some((v) => sameValue(v, typed)) && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(typed)}
                      className="w-full flex items-center gap-1.5 text-left px-3 py-2 text-sm font-semibold text-[#80172B] border-t border-gray-100 hover:bg-[#80172B]/5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add &ldquo;{typed}&rdquo;
                    </button>
                  )}
                  {suggestions.length === 0 && !typed && (
                    <p className="px-3 py-2 text-xs text-gray-500">Type a value to add it.</p>
                  )}
                </div>
              )}
            </div>
            {clash && <p className="text-xs text-amber-700 mt-1.5">{clashMessage(clash)}</p>}
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
              disabled={submitting || Boolean(clash)}
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
