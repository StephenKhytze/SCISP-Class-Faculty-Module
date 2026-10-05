import { useEffect, useMemo, useState } from 'react';
import { X, Save, Pencil, BookOpen, AlertTriangle, Archive, ArchiveRestore } from 'lucide-react';
import api from '../../../services/api';
import ConfirmDialog from './ConfirmDialog';

// A subject code is one catalog entry system-wide, not just within this course/year - "MATH1"
// and "MATH 1" are the same code with a stray space, not two different subjects. Comparing
// with whitespace stripped and case-folded catches that even though two literally-different
// strings would otherwise both look "free" to use.
const normalizeCode = (code) => code.trim().toUpperCase().replace(/\s+/g, '');

// Subjects assigned here (course_id + year_label) are what the Add Schedule form's
// Subject dropdown filters down to for this exact timetable - see ScheduleEditModal.
export default function ManageSubjectsModal({ open, context, contextLabel, onClose }) {
  const [subjects, setSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]); // whole catalog, for duplicate detection only
  const [archivedSubjects, setArchivedSubjects] = useState([]);
  const [viewingArchived, setViewingArchived] = useState(false);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // subject being edited, or {} for new
  const [form, setForm] = useState({ subject_code: '', subject_name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get('/subjects', { params: context })
      .then((res) => setSubjects(res.data))
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false));
    // Includes archived subjects too - the subject_code column is unique regardless of
    // archived_at, so an archived code still counts as "taken" for duplicate detection.
    api.get('/subjects', { params: { all: 1 } }).then((res) => setAllSubjects(res.data)).catch(() => setAllSubjects([]));
  }, [open, context.course_id, context.year_label, context.strand]);

  useEffect(() => {
    if (!open || !viewingArchived) return;
    setArchivedLoading(true);
    api
      .get('/subjects', { params: { ...context, archived: 1 } })
      .then((res) => setArchivedSubjects(res.data))
      .catch(() => setArchivedSubjects([]))
      .finally(() => setArchivedLoading(false));
  }, [open, viewingArchived, context.course_id, context.year_label, context.strand]);

  const duplicateMatch = useMemo(() => {
    const code = form.subject_code.trim();
    if (!code) return null;
    const normalized = normalizeCode(code);
    return (
      allSubjects.find((s) => s.subject_id !== editing?.subject_id && normalizeCode(s.subject_code) === normalized) ||
      null
    );
  }, [form.subject_code, allSubjects, editing]);

  if (!open) return null;

  const startAdd = () => {
    setEditing({});
    setForm({ subject_code: '', subject_name: '' });
    setError(null);
  };
  const startEdit = (subject) => {
    setEditing(subject);
    setForm({ subject_code: subject.subject_code, subject_name: subject.subject_name });
    setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = { ...form, ...context };
    const request = editing.subject_id
      ? api.put(`/subjects/${editing.subject_id}`, payload)
      : api.post('/subjects', payload);

    request
      .then((res) => {
        setSubjects((prev) =>
          prev.some((s) => s.subject_id === res.data.subject_id)
            ? prev.map((s) => (s.subject_id === res.data.subject_id ? res.data : s))
            : [...prev, res.data]
        );
        setAllSubjects((prev) =>
          prev.some((s) => s.subject_id === res.data.subject_id)
            ? prev.map((s) => (s.subject_id === res.data.subject_id ? res.data : s))
            : [...prev, res.data]
        );
        setEditing(null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to save that subject.'))
      .finally(() => setSubmitting(false));
  };

    const askArchive = (subject) =>
    setPendingAction({
      title: `Archive Subject ${subject.subject_code}?`,
      message: 'This subject will be moved to Archived Subjects. Existing schedule history will be preserved.',
      confirmLabel: 'Archive',
      tone: 'warning',
      run: () => archiveSubject(subject),
    });

  const archiveSubject = (subject) => {
    api
      .patch(`/subjects/${subject.subject_id}/archive`)
      .then((res) => {
        setSubjects((prev) => prev.filter((s) => s.subject_id !== subject.subject_id));
        // Stays in allSubjects (just updated) rather than removed - its code is still taken
        // (the DB's unique constraint applies regardless of archived_at), so duplicate
        // detection needs to keep seeing it, just flagged as archived now.
        setAllSubjects((prev) => prev.map((s) => (s.subject_id === subject.subject_id ? res.data : s)));
        setArchivedSubjects((prev) => [...prev, res.data]);
      })
      .catch(() => setError('Unable to archive that subject.'));
  };

  const askRestore = (subject) =>
    setPendingAction({
      title: `Restore Subject ${subject.subject_code}?`,
      message: 'This subject will reappear in the active list and in Add Schedule.',
      confirmLabel: 'Restore',
      run: () => restoreSubject(subject),
    });

  const restoreSubject = (subject) => {
    api
      .patch(`/subjects/${subject.subject_id}/restore`)
      .then((res) => {
        setArchivedSubjects((prev) => prev.filter((s) => s.subject_id !== subject.subject_id));
        setSubjects((prev) => [...prev, res.data]);
        setAllSubjects((prev) => prev.map((s) => (s.subject_id === subject.subject_id ? res.data : s)));
      })
      .catch(() => setError('Unable to restore that subject.'));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-lg w-full p-6 relative max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Manage Subjects</h2>
        <div className="flex items-center justify-between gap-3 mb-5">
          <p className="text-sm text-gray-500">For {contextLabel}.</p>
          {!editing && (
            <button
              type="button"
              onClick={() => setViewingArchived((v) => !v)}
              className="text-xs font-semibold text-[#80172B] hover:underline shrink-0"
            >
              {viewingArchived ? 'View Active Subjects' : 'View Archived'}
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4 mb-5 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase">Subject Code</label>
                <input
                  value={form.subject_code}
                  onChange={(e) => setForm((f) => ({ ...f, subject_code: e.target.value }))}
                  required
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase">Subject Name</label>
                <input
                  value={form.subject_name}
                  onChange={(e) => setForm((f) => ({ ...f, subject_name: e.target.value }))}
                  required
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
                />
              </div>
            </div>

            {duplicateMatch && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  {duplicateMatch.archived_at ? 'This code was already used by an archived subject: ' : 'A subject with a matching code already exists: '}
                  <strong>{duplicateMatch.subject_code}</strong> ({duplicateMatch.subject_name}
                  {duplicateMatch.year_label && <> &middot; {duplicateMatch.year_label}</>}
                  {duplicateMatch.strand && <> &middot; {duplicateMatch.strand}</>})
                  {duplicateMatch.archived_at
                    ? '. Restore it (View Archived) instead of creating a new one.'
                    : '. Use a different code, or edit that one instead.'}
                </p>
              </div>
            )}

            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || Boolean(duplicateMatch)}
                className="flex items-center gap-1.5 bg-[#80172B] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#651020] transition-colors disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        ) : !viewingArchived ? (
          <button
            onClick={startAdd}
            className="w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-300 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:border-[#80172B] hover:text-[#80172B] transition-colors mb-4"
          >
            + Add Subject
          </button>
        ) : null}

        {editing ? null : viewingArchived ? (
          archivedLoading ? (
            <p className="text-sm text-gray-500">Loading archived subjects...</p>
          ) : archivedSubjects.length === 0 ? (
            <div className="text-center py-6">
              <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No archived subjects for this timetable.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
              {archivedSubjects.map((s) => (
                <li key={s.subject_id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-500">{s.subject_code}</p>
                    <p className="text-xs text-gray-400 truncate">{s.subject_name}</p>
                  </div>
                  <button
                    onClick={() => askRestore(s)}
                    className="text-gray-400 hover:text-[#80172B] transition-colors shrink-0"
                    title="Restore subject"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : loading ? (
          <p className="text-sm text-gray-500">Loading subjects...</p>
        ) : subjects.length === 0 ? (
          <div className="text-center py-6">
            <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No subjects assigned to this timetable yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
            {subjects.map((s) => (
              <li key={s.subject_id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{s.subject_code}</p>
                  <p className="text-xs text-gray-500 truncate">{s.subject_name}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(s)}
                    className="text-gray-400 hover:text-[#80172B] transition-colors p-1"
                    title="Edit subject"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => askArchive(s)}
                    className="text-gray-300 hover:text-amber-600 transition-colors p-1"
                    title="Archive subject"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.title}
        message={pendingAction?.message}
        confirmLabel={pendingAction?.confirmLabel}
        tone={pendingAction?.tone ?? 'default'}
        onConfirm={() => { const a = pendingAction; setPendingAction(null); a.run(); }}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
