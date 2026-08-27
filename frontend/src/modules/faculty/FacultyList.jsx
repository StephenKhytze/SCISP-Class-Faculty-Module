import { useEffect, useMemo, useState } from 'react';
import { Search, RotateCcw, Users, CalendarClock } from 'lucide-react';
import api from '../../services/api';
import FacultyCard from './components/FacultyCard';
import FacultyProfileModal from './components/FacultyProfileModal';
import { STATUS_LABELS, statusLabel } from './constants';

const EMPTY_FILTERS = {
  search: '',
  department: '',
  position: '',
  specialization: '',
  status: '',
};

export default function FacultyList() {
  const [activeTab, setActiveTab] = useState('directory');
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api
      .get('/faculty')
      .then((res) => setFaculties(res.data))
      .catch(() => setError('Unable to load faculty directory.'))
      .finally(() => setLoading(false));
  }, []);

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

  const handleBook = (faculty) => {
    setBookings((prev) => [
      { id: `${faculty.id}-${Date.now()}`, faculty, requestedAt: new Date() },
      ...prev,
    ]);
    setActiveTab('bookings');
  };

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
          Search department professors, check real-time availability, view linked class schedules & request consultation booking slots.
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors ${
            activeTab === 'directory'
              ? 'bg-[#80172B] text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Faculty Roster Directory ({faculties.length})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors ${
            activeTab === 'bookings'
              ? 'bg-[#80172B] text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          My Consultation Bookings
          {bookings.length > 0 && (
            <span className="bg-amber-400 text-[#651020] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {bookings.length}
            </span>
          )}
        </button>
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

          {!loading && !error && (
            <>
              {filteredFaculties.length === 0 ? (
                <p className="text-sm text-gray-500">No faculty members match your filters.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredFaculties.map((faculty) => (
                    <FacultyCard
                      key={faculty.id}
                      faculty={faculty}
                      onViewProfile={setSelectedFaculty}
                      onBook={handleBook}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <BookingsPanel bookings={bookings} />
      )}

      <FacultyProfileModal faculty={selectedFaculty} onClose={() => setSelectedFaculty(null)} />
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

function BookingsPanel({ bookings }) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
        <CalendarClock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">
          You haven't requested any consultation slots yet. Click "Book" on a faculty card to get started.
        </p>
        <p className="text-xs text-gray-400 mt-2">Consultation booking is a preview feature — requests are not yet sent to faculty.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map(({ id, faculty, requestedAt }) => (
        <div key={id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{faculty.name}</p>
            <p className="text-xs text-gray-500">
              {faculty.department} &middot; {statusLabel(faculty.availability_status, faculty.status_detail)}
            </p>
            {faculty.office_hours && (
              <p className="text-xs text-gray-500">Office Hours: {faculty.office_hours}</p>
            )}
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
              Pending
            </span>
            <p className="text-[11px] text-gray-400 mt-1">
              Requested {requestedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
