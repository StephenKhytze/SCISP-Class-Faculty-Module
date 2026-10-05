import { useEffect, useState } from 'react';
import { Send, Inbox, MessageSquareText } from 'lucide-react';
import api from '../../../services/api';
import ConfirmDialog from '../../schedule/components/ConfirmDialog';
import { LEAVE_STATUS_LABELS, LEAVE_STATUS_STYLES, formatLeaveRange, leaveDayCount } from '../constants';

const EMPTY_FORM = { start_date: '', end_date: '', reason: '' };

export default function TeacherLeavePanel() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get('/leave-requests/me')
      .then((res) => setLeaves(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load your leave requests.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);
    if (form.end_date < form.start_date) {
      setFormError('End date cannot be earlier than the start date.');
      return;
    }
    setSubmitting(true);
    api
      .post('/leave-requests', form)
      .then((res) => {
        setLeaves((prev) => [res.data, ...prev]);
        setForm(EMPTY_FORM);
      })
      .catch((err) => setFormError(err.response?.data?.message || 'Unable to file that leave request.'))
      .finally(() => setSubmitting(false));
  };

  // Cancelling a leave asks first through the shared dialog; the request itself is unchanged.
  const askCancel = (leave) => setPendingCancel(leave);

  const cancelLeave = (leave) => {
    api
      .patch(`/leave-requests/${leave.leave_request_id}/cancel`)
      .then((res) => setLeaves((prev) => prev.map((l) => (l.leave_request_id === leave.leave_request_id ? res.data : l))))
      .catch((err) => setError(err.response?.data?.message || 'Unable to cancel that leave request.'));
  };

  const inputClass =
    'w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#80172B]/30';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <ConfirmDialog
        open={Boolean(pendingCancel)}
        title="Cancel Leave Request?"
        message="Your leave request will be cancelled. You can file a new one afterwards."
        confirmLabel="Cancel Request"
        tone="danger"
        onConfirm={() => {
          const leave = pendingCancel;
          setPendingCancel(null);
          cancelLeave(leave);
        }}
        onCancel={() => setPendingCancel(null)}
      />
      <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 space-y-4 h-fit">
        <div>
          <h3 className="text-base font-bold text-gray-900">File a Leave</h3>
          <p className="text-xs text-gray-500 mt-0.5">Your request will be sent to the admin for approval.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase">Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, start_date: e.target.value, end_date: f.end_date || e.target.value }))
              }
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase">End Date</label>
            <input
              type="date"
              value={form.end_date}
              min={form.start_date || undefined}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-gray-400 uppercase">Reason</label>
          <textarea
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            required
            rows={4}
            maxLength={2000}
            placeholder="Explain why you are taking this leave..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {formError && <p className="text-sm text-rose-600">{formError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-1.5 bg-[#80172B] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#651020] transition-colors disabled:opacity-60"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </form>

      <div className="lg:col-span-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">My Leave Requests</h3>

        {loading && <p className="text-sm text-gray-500">Loading leave requests...</p>}
        {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

        {!loading && leaves.length === 0 && !error && (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">You haven't filed any leave requests yet.</p>
          </div>
        )}

        <div className="space-y-3">
          {leaves.map((leave) => (
            <div key={leave.leave_request_id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">
                    {formatLeaveRange(leave.start_date, leave.end_date)} &middot; {leaveDayCount(leave.start_date, leave.end_date)} day(s)
                  </p>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${LEAVE_STATUS_STYLES[leave.status]}`}>
                  {LEAVE_STATUS_LABELS[leave.status] || leave.status}
                </span>
              </div>

              <p className="text-sm text-gray-700 mt-3 whitespace-pre-line break-words">{leave.reason}</p>

              {leave.admin_remarks && (
                <div className="flex items-start gap-2 mt-3 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                  <MessageSquareText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Admin remarks:</span> {leave.admin_remarks}
                  </p>
                </div>
              )}

              {leave.status === 'pending' && (
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => askCancel(leave)}
                    className="text-xs font-semibold text-gray-500 hover:text-rose-600 transition-colors"
                  >
                    Cancel Request
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
