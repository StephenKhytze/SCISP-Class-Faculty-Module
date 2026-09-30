import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Inbox,
  Search,
  MessageSquareText,
  Clock,
  CalendarRange,
  CalendarOff,
  UserRound,
  X,
  Eye,
} from 'lucide-react';
import api from '../../../services/api';
import { LEAVE_STATUS_LABELS, LEAVE_STATUS_STYLES, formatLeaveRange, leaveDayCount } from '../constants';

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isOnLeaveToday = (leave, today) =>
  leave.status === 'approved' && leave.start_date <= today && leave.end_date >= today;

// Same look as BookingStatCards so both admin tabs feel like one system.
const STAT_CARDS = [
  { key: 'all', label: 'Total Requests', icon: CalendarRange, tone: 'bg-white border-gray-200 text-gray-700', ring: 'ring-gray-400' },
  { key: 'pending', label: 'Pending Review', icon: Clock, tone: 'bg-amber-50 border-amber-200 text-amber-700', ring: 'ring-amber-400' },
  { key: 'approved', label: 'Approved Leaves', icon: CheckCircle2, tone: 'bg-emerald-50 border-emerald-200 text-emerald-700', ring: 'ring-emerald-400' },
  { key: 'declined', label: 'Declined Requests', icon: XCircle, tone: 'bg-white border-gray-200 text-gray-700', ring: 'ring-rose-400' },
];

const FILTER_TITLES = {
  pending: 'Pending Leave Requests',
  approved: 'Approved Leave Requests',
  declined: 'Declined Leave Requests',
  all: 'All Leave Requests',
};

const formatFiled = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export default function AdminLeavePanel({ onLeaveChanged }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [reviewing, setReviewing] = useState(null); // { leave, decision: 'approved' | 'declined' | null }

  const today = todayIso();

  useEffect(() => {
    api
      .get('/leave-requests')
      .then((res) => setLeaves(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load leave requests.'))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = { all: leaves.length, pending: 0, approved: 0, declined: 0, cancelled: 0, today: 0 };
    leaves.forEach((l) => {
      c[l.status] = (c[l.status] || 0) + 1;
      if (isOnLeaveToday(l, today)) c.today += 1;
    });
    return c;
  }, [leaves, today]);

  const filteredLeaves = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const list = leaves.filter((l) => {
      if (filter === 'today' && !isOnLeaveToday(l, today)) return false;
      if (!['all', 'today'].includes(filter) && l.status !== filter) return false;
      if (keyword && !`${l.faculty?.name} ${l.faculty?.department} ${l.reason}`.toLowerCase().includes(keyword)) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === 'soonest') return a.start_date.localeCompare(b.start_date);
      if (sort === 'oldest') return a.created_at.localeCompare(b.created_at);
      return b.created_at.localeCompare(a.created_at);
    });
  }, [leaves, filter, search, sort, today]);

  const handleReviewed = (updated) => {
    setLeaves((prev) => prev.map((l) => (l.leave_request_id === updated.leave_request_id ? updated : l)));
    setReviewing(null);
    onLeaveChanged?.();
  };

  if (loading) return <p className="text-sm text-gray-500">Loading leave requests...</p>;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map(({ key, label, icon: Icon, tone, ring }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-left border rounded-xl p-4 flex items-center justify-between transition-all hover:shadow-md ${tone} ${
              filter === key ? `ring-2 ${ring} shadow-sm` : ''
            }`}
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{label}</p>
              <p className="text-2xl font-extrabold">{counts[key] || 0}</p>
            </div>
            <Icon className="w-6 h-6 opacity-60" />
          </button>
        ))}
      </div>

      {counts.today > 0 && (
        <div className="w-full flex items-center justify-between gap-3 bg-[#80172B]/5 border border-[#80172B]/20 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#80172B]/10 flex items-center justify-center shrink-0">
              <CalendarOff className="w-6 h-6 text-[#80172B]" />
            </div>
            <div className="text-left min-w-0">
              <p className="font-bold text-gray-900 text-sm">Teachers On Leave Today</p>
              <p className="text-xs text-gray-500 truncate">
                {leaves.filter((l) => isOnLeaveToday(l, today)).map((l) => l.faculty?.name).join(', ')}
              </p>
            </div>
          </div>
          <span className="bg-[#80172B]/10 text-[#80172B] text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
            {counts.today} on leave
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{FILTER_TITLES[filter]}</h3>
          <p className="text-xs text-gray-500">
            Showing {filteredLeaves.length} of {counts[filter] || 0}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teacher..."
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
          >
            <option value="newest">Newest filed</option>
            <option value="oldest">Oldest filed</option>
            <option value="soonest">Leave date (soonest)</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

      {filteredLeaves.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {search
              ? 'No leave requests match your search.'
              : filter === 'pending'
                ? 'No pending leave requests right now.'
                : 'No leave requests to show.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <>
            <div className="hidden lg:grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.6fr)_7rem_7rem_13rem] gap-4 px-4 py-2 bg-gray-50 text-[11px] font-bold uppercase tracking-wide text-gray-400">
              <span>Teacher</span>
              <span>Leave Dates</span>
              <span>Reason</span>
              <span>Filed</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredLeaves.map((leave) => (
                <LeaveRow
                  key={leave.leave_request_id}
                  leave={leave}
                  today={today}
                  onView={() => setReviewing({ leave, decision: null })}
                  onDecide={(decision) => setReviewing({ leave, decision })}
                />
              ))}
            </div>
          </>
        </div>
      )}

      {reviewing && (
        <ReviewModal
          leave={reviewing.leave}
          initialDecision={reviewing.decision}
          today={today}
          onClose={() => setReviewing(null)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  );
}

function StatusBadge({ leave, today }) {
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${LEAVE_STATUS_STYLES[leave.status]}`}>
        {LEAVE_STATUS_LABELS[leave.status] || leave.status}
      </span>
      {isOnLeaveToday(leave, today) && (
        <span className="text-[10px] font-bold uppercase text-[#80172B]">On leave today</span>
      )}
    </span>
  );
}

function LeaveRow({ leave, today, onView, onDecide }) {
  const days = leaveDayCount(leave.start_date, leave.end_date);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.6fr)_7rem_7rem_13rem] gap-2 lg:gap-4 px-4 py-3 lg:items-center hover:bg-gray-50/60 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-[#80172B]/10 flex items-center justify-center shrink-0">
          <UserRound className="w-5 h-5 text-[#80172B]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 truncate">{leave.faculty?.name || 'Unknown teacher'}</p>
          <p className="text-xs text-gray-500 truncate">{leave.faculty?.department}</p>
        </div>
        <span className="lg:hidden">
          <StatusBadge leave={leave} today={today} />
        </span>
      </div>

      <div className="text-sm">
        <p className="font-semibold text-gray-800">{formatLeaveRange(leave.start_date, leave.end_date)}</p>
        <p className="text-xs text-gray-500">{days} day{days !== 1 ? 's' : ''}</p>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 break-words" title={leave.reason}>
        {leave.reason}
      </p>

      <p className="hidden lg:block text-xs text-gray-500">{formatFiled(leave.created_at)}</p>

      <span className="hidden lg:block">
        <StatusBadge leave={leave} today={today} />
      </span>

      <div className="flex lg:justify-end gap-2">
        {leave.status === 'pending' ? (
          <>
            <button
              onClick={() => onDecide('approved')}
              title="Approve"
              className="flex-1 lg:flex-none flex items-center justify-center gap-1 bg-emerald-600 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => onDecide('declined')}
              title="Decline"
              className="flex-1 lg:flex-none flex items-center justify-center gap-1 border border-rose-300 text-rose-700 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Decline
            </button>
          </>
        ) : (
          <button
            onClick={onView}
            className="flex items-center gap-1 text-xs font-semibold text-[#80172B] hover:underline"
          >
            <Eye className="w-3.5 h-3.5" />
            View details
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewModal({ leave, initialDecision, today, onClose, onReviewed }) {
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const days = leaveDayCount(leave.start_date, leave.end_date);
  const isPending = leave.status === 'pending';

  const submit = (status) => {
    setSubmitting(true);
    setError(null);
    api
      .patch(`/leave-requests/${leave.leave_request_id}`, { status, admin_remarks: remarks.trim() || null })
      .then((res) => onReviewed(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to update that leave request.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full p-6 relative max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold text-gray-900 mb-4">{isPending ? 'Review Leave Request' : 'Leave Request Details'}</h2>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-[#80172B]/10 flex items-center justify-center shrink-0">
            <UserRound className="w-6 h-6 text-[#80172B]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 truncate">{leave.faculty?.name}</p>
            <p className="text-xs text-gray-500 truncate">{leave.faculty?.department}</p>
          </div>
          <StatusBadge leave={leave} today={today} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase">Leave Dates</p>
            <p className="text-sm font-semibold text-gray-800">{formatLeaveRange(leave.start_date, leave.end_date)}</p>
            <p className="text-xs text-gray-500">{days} day{days !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase">Filed On</p>
            <p className="text-sm font-semibold text-gray-800">{formatFiled(leave.created_at)}</p>
            {leave.reviewed_at && <p className="text-xs text-gray-500">Reviewed {formatFiled(leave.reviewed_at)}</p>}
          </div>
        </div>

        <p className="text-[11px] font-semibold text-gray-400 uppercase">Reason</p>
        <p className="text-sm text-gray-700 whitespace-pre-line break-words mb-4">{leave.reason}</p>

        {isPending ? (
          <>
            <label className="text-[11px] font-semibold text-gray-400 uppercase">Remarks for the teacher (optional)</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              maxLength={2000}
              autoFocus
              placeholder={initialDecision === 'declined' ? 'Let the teacher know why this was declined...' : 'e.g. Please coordinate a substitute.'}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
            />
            {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => submit('declined')}
                disabled={submitting}
                className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 ${
                  initialDecision === 'declined'
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'border border-rose-300 text-rose-700 hover:bg-rose-50'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Decline
              </button>
              <button
                onClick={() => submit('approved')}
                disabled={submitting}
                className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 ${
                  initialDecision === 'declined'
                    ? 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </button>
            </div>
          </>
        ) : (
          leave.admin_remarks && (
            <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <MessageSquareText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Admin remarks:</span> {leave.admin_remarks}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
