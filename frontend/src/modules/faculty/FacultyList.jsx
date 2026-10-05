import { useEffect, useMemo, useState } from 'react';
import { Search, RotateCcw, Users, CalendarClock, UserPlus, ClipboardList, CalendarOff } from 'lucide-react';
import api from '../../services/api';
import FacultyCard from './components/FacultyCard';
import ConfirmDialog from '../schedule/components/ConfirmDialog';
import FacultyProfileModal from './components/FacultyProfileModal';
import TeacherBookingsDashboard from './components/TeacherBookingsDashboard';
import MyBookingsPanel from './components/MyBookingsPanel';
import AdminBookingsPanel from './components/AdminBookingsPanel';
import BookingRequestModal from './components/BookingRequestModal';
import FacultyEditModal from './components/FacultyEditModal';
import FacultyScheduleModal from './components/FacultyScheduleModal';
import TeacherLeavePanel from './components/TeacherLeavePanel';
import AdminLeavePanel from './components/AdminLeavePanel';
import { STATUS_LABELS } from './constants';

const EMPTY_FILTERS = {
  search: '',
  department: '',
  position: '',
  specialization: '',
  status: '',
};

export default function FacultyList() {
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  }, []);
  const isFaculty = currentUser?.role === 'Teacher';
  const isAdmin = currentUser?.role === 'Admin';
  const isStudent = currentUser?.role === 'Student';
  const canManageBookings = isFaculty;
  const canBookConsultation = !isFaculty && !isAdmin;
  const canEditFaculty = isAdmin;
  const canViewMyBookings = isStudent;
  const canViewDirectory = !isFaculty;
  const canManageAllBookings = isAdmin;

  const [activeTab, setActiveTab] = useState(isFaculty ? 'bookings' : 'directory');
  const [faculties, setFaculties] = useState([]);
  const [archivedFaculties, setArchivedFaculties] = useState([]);
  const [showArchivedTeachers, setShowArchivedTeachers] = useState(false);
  const [pendingTeacherArchive, setPendingTeacherArchive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [bookingFaculty, setBookingFaculty] = useState(null);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [scheduleViewFaculty, setScheduleViewFaculty] = useState(null);
  const [pendingByFaculty, setPendingByFaculty] = useState({});

  useEffect(() => {
    if (!canViewDirectory) {
      setLoading(false);
      return;
    }
    api
      .get('/faculty')
      .then((res) => setFaculties(res.data))
      .catch(() => setError('Unable to load faculty directory.'))
      .finally(() => setLoading(false));
  }, [canViewDirectory]);

  // Soft archive for teachers: the row and its schedules stay; it only leaves the active list.
  useEffect(() => {
    if (!canEditFaculty || !showArchivedTeachers) return;
    api.get('/faculty', { params: { archived: 1 } }).then((res) => setArchivedFaculties(res.data)).catch(() => setArchivedFaculties([]));
  }, [canEditFaculty, showArchivedTeachers]);

  const confirmArchiveTeacher = () => {
    const teacher = pendingTeacherArchive;
    setPendingTeacherArchive(null);
    api
      .patch(`/faculty/${teacher.faculty_id}/archive`)
      .then((res) => {
        setFaculties((prev) => prev.filter((f) => f.faculty_id !== teacher.faculty_id));
        setArchivedFaculties((prev) => [...prev.filter((f) => f.faculty_id !== teacher.faculty_id), res.data]);
      })
      .catch(() => setError('Unable to archive that teacher.'));
  };

  const restoreTeacher = (teacher) => {
    api
      .patch(`/faculty/${teacher.faculty_id}/restore`)
      .then((res) => {
        setArchivedFaculties((prev) => prev.filter((f) => f.faculty_id !== teacher.faculty_id));
        setFaculties((prev) => [...prev.filter((f) => f.faculty_id !== teacher.faculty_id), res.data]);
      })
      .catch(() => setError('Unable to restore that teacher.'));
  };

  const refreshPendingCounts = () => {
    if (!isAdmin) return;
    api
      .get('/consultations', { params: { status: 'pending' } })
      .then((res) => {
        const counts = {};
        res.data.forEach((b) => {
          counts[b.faculty_id] = (counts[b.faculty_id] || 0) + 1;
        });
        setPendingByFaculty(counts);
      })
      .catch(() => setPendingByFaculty({}));
  };

  useEffect(refreshPendingCounts, [isAdmin]);

  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const refreshPendingLeaveCount = () => {
    if (!isAdmin) return;
    api
      .get('/leave-requests', { params: { status: 'pending' } })
      .then((res) => setPendingLeaveCount(res.data.length))
      .catch(() => setPendingLeaveCount(0));
  };

  useEffect(refreshPendingLeaveCount, [isAdmin]);

  const departments = useMemo(
    () => [...new Set(faculties.map((f) => f.department))].sort(),
    [faculties]
  );
  const positions = useMemo(
    () => [...new Set(faculties.map((f) => f.position))].sort(),
    [faculties]
  );
  const specializations = useMemo(
    () => [...new Set(faculties.flatMap((f) => f.specializations || []))].sort(),
    [faculties]
  );

  const filteredFaculties = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    return faculties.filter((f) => {
      if (filters.department && f.department !== filters.department) return false;
      if (filters.position && f.position !== filters.position) return false;
      if (filters.status && f.availability_status !== filters.status) return false;
      if (filters.specialization && !f.specializations?.includes(filters.specialization)) return false;
      if (keyword) {
        const haystack = `${f.name} ${f.room} ${f.position}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      return true;
    });
  }, [faculties, filters]);

  const handleBook = (faculty) => setBookingFaculty(faculty);
  const handleEdit = (faculty) => setEditingFaculty(faculty);
  const handleAdd = () => setEditingFaculty({});
  const handleViewSchedule = (faculty) => {
    setSelectedFaculty(null);
    setScheduleViewFaculty(faculty);
  };
  const handleCloseScheduleModal = () => {
    setScheduleViewFaculty(null);
    refreshPendingCounts();
  };
  const handleFacultySaved = (saved) =>
    setFaculties((prev) =>
      prev.some((f) => f.faculty_id === saved.faculty_id)
        ? prev.map((f) => (f.faculty_id === saved.faculty_id ? saved : f))
        : [...prev, saved]
    );

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs mb-2">
          <span className="bg-[#80172B]/10 text-[#80172B] font-bold uppercase tracking-wide px-2.5 py-1 rounded">
            Faculty Directory Module
          </span>
          <span className="text-gray-400">&middot; Academic Year 2026-2027</span>
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">Faculty Directory & Consultation Schedule</h2>
        <p className="text-sm text-gray-500 mt-1">
          Search department professors, check real-time availability, view linked class schedules & request consultation appointment slots.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          {canViewDirectory && (
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors shrink-0 whitespace-nowrap ${
                activeTab === 'directory'
                  ? 'bg-[#80172B] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Faculty Roster Directory ({faculties.length})
            </button>
          )}
          {canManageBookings && (
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors shrink-0 whitespace-nowrap ${
                activeTab === 'bookings'
                  ? 'bg-[#80172B] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarClock className="w-4 h-4" />
              My Consultation Appointments
            </button>
          )}
          {isFaculty && (
            <button
              onClick={() => setActiveTab('my-leave')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors shrink-0 whitespace-nowrap ${
                activeTab === 'my-leave'
                  ? 'bg-[#80172B] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarOff className="w-4 h-4" />
              My Leave Requests
            </button>
          )}
          {canViewMyBookings && (
            <button
              onClick={() => setActiveTab('my-bookings')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors shrink-0 whitespace-nowrap ${
                activeTab === 'my-bookings'
                  ? 'bg-[#80172B] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarClock className="w-4 h-4" />
              My Consultation Appointments
            </button>
          )}
          {canManageAllBookings && (
            <button
              onClick={() => setActiveTab('all-bookings')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors shrink-0 whitespace-nowrap ${
                activeTab === 'all-bookings'
                  ? 'bg-[#80172B] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              All Consultation Appointments
              {Object.values(pendingByFaculty).reduce((sum, n) => sum + n, 0) > 0 && (
                <span className="bg-amber-100 text-amber-700 text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                  {Object.values(pendingByFaculty).reduce((sum, n) => sum + n, 0)}
                </span>
              )}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('leave-requests')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors shrink-0 whitespace-nowrap ${
                activeTab === 'leave-requests'
                  ? 'bg-[#80172B] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarOff className="w-4 h-4" />
              Leave Requests
              {pendingLeaveCount > 0 && (
                <span className="bg-amber-100 text-amber-700 text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingLeaveCount}
                </span>
              )}
            </button>
          )}
        </div>
        {canEditFaculty && activeTab === 'directory' && (
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-1.5 bg-[#80172B] text-white text-sm font-semibold px-4 py-2 mb-2 rounded-lg hover:bg-[#651020] transition-colors shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Add Teacher
          </button>
        )}
      </div>

      {activeTab === 'directory' ? (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Search & Directory Filters
              </span>
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="flex items-center gap-1.5 text-xs font-medium text-[#80172B] hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-1">
                <label className="text-[11px] font-semibold text-gray-400 uppercase">Search Faculty / Keyword</label>
                <div className="relative mt-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    placeholder="Search name, room, title..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
                  />
                </div>
              </div>

              <FilterSelect
                label="Department"
                value={filters.department}
                onChange={(v) => setFilters((f) => ({ ...f, department: v }))}
                options={departments}
                allLabel="All Departments"
              />
              <FilterSelect
                label="Academic Position"
                value={filters.position}
                onChange={(v) => setFilters((f) => ({ ...f, position: v }))}
                options={positions}
                allLabel="All Positions"
              />
              <FilterSelect
                label="Field of Expertise"
                value={filters.specialization}
                onChange={(v) => setFilters((f) => ({ ...f, specialization: v }))}
                options={specializations}
                allLabel="All Specializations"
              />
              <FilterSelect
                label="Availability Status"
                value={filters.status}
                onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
                options={Object.keys(STATUS_LABELS)}
                optionLabel={(v) => STATUS_LABELS[v]}
                allLabel="All Statuses"
              />
            </div>
          </div>

          {loading && <p className="text-sm text-gray-500">Loading faculty directory...</p>}
          {error && <p className="text-sm text-rose-600">{error}</p>}

          {canEditFaculty && (
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => setShowArchivedTeachers((v) => !v)}
                className="text-xs font-semibold text-[#80172B] hover:underline"
              >
                {showArchivedTeachers ? 'Back to Active Teachers' : 'View Archived Teachers'}
              </button>
            </div>
          )}

          {!loading && !error && !showArchivedTeachers && (
            <>
              {filteredFaculties.length === 0 ? (
                <p className="text-sm text-gray-500">{faculties.length === 0 ? 'No active teachers.' : 'No faculty members match your filters.'}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredFaculties.map((faculty) => (
                    <FacultyCard
                      key={faculty.faculty_id}
                      faculty={faculty}
                      onViewProfile={setSelectedFaculty}
                      onBook={handleBook}
                      onEdit={handleEdit}
                      onArchive={setPendingTeacherArchive}
                      onManageBookings={handleViewSchedule}
                      canBook={canBookConsultation}
                      canEdit={canEditFaculty}
                      pendingCount={pendingByFaculty[faculty.faculty_id] || 0}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {canEditFaculty && showArchivedTeachers && (
            archivedFaculties.length === 0 ? (
              <p className="text-sm text-gray-500">No archived teachers.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {archivedFaculties.map((faculty) => (
                  <FacultyCard
                    key={faculty.faculty_id}
                    faculty={faculty}
                    archived
                    onViewProfile={setSelectedFaculty}
                    onRestore={restoreTeacher}
                    canEdit={canEditFaculty}
                  />
                ))}
              </div>
            )
          )}

          <ConfirmDialog
            open={Boolean(pendingTeacherArchive)}
            title={`Archive Teacher ${pendingTeacherArchive?.name ?? ''}?`}
            message="This teacher will be moved to Archived Teachers. Existing schedule history will be preserved."
            confirmLabel="Archive Teacher"
            tone="warning"
            onConfirm={confirmArchiveTeacher}
            onCancel={() => setPendingTeacherArchive(null)}
          />
        </>
      ) : activeTab === 'bookings' ? (
        canManageBookings && <TeacherBookingsDashboard />
      ) : activeTab === 'my-leave' ? (
        isFaculty && <TeacherLeavePanel />
      ) : activeTab === 'leave-requests' ? (
        isAdmin && <AdminLeavePanel onLeaveChanged={refreshPendingLeaveCount} />
      ) : activeTab === 'all-bookings' ? (
        canManageAllBookings && <AdminBookingsPanel onBookingChanged={refreshPendingCounts} />
      ) : (
        canViewMyBookings && <MyBookingsPanel />
      )}

      <FacultyProfileModal
        faculty={selectedFaculty}
        onClose={() => setSelectedFaculty(null)}
        isAdmin={isAdmin}
        onViewSchedule={handleViewSchedule}
      />
      <BookingRequestModal faculty={bookingFaculty} onClose={() => setBookingFaculty(null)} />
      <FacultyEditModal faculty={editingFaculty} onClose={() => setEditingFaculty(null)} onSaved={handleFacultySaved} />
      <FacultyScheduleModal faculty={scheduleViewFaculty} onClose={handleCloseScheduleModal} />
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, optionLabel, allLabel }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-400 uppercase">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
      >
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {optionLabel ? optionLabel(opt) : opt}
          </option>
        ))}
      </select>
    </div>
  );
}
