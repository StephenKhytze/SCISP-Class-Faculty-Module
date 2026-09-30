import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Settings } from 'lucide-react';

// Standardized display format used everywhere a room is shown (this exact string is also
// what the backend derives into schedules.room, so what's typed here matches what ends up
// on the timetable grid, class cards, and PDF export).
const formatRoom = (room) => (room ? `${room.room_code} • ${room.building}` : '');

// Searchable, building-grouped dropdown for picking a room from the Room masterlist -
// replaces the old free-text Room input so every schedule's room_id points at one
// consistent, structured catalog entry instead of ad-hoc typed strings.
export default function RoomCombobox({ rooms, value, onSelect, onOpenManageRooms }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);

  const selectedRoom = rooms.find((r) => String(r.room_id) === String(value)) || null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const groups = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const filtered = rooms.filter((r) => {
      if (!keyword) return true;
      const haystack = `${r.room_code} ${r.room_name || ''} ${r.building}`.toLowerCase();
      return haystack.includes(keyword);
    });
    const byBuilding = new Map();
    filtered.forEach((r) => {
      if (!byBuilding.has(r.building)) byBuilding.set(r.building, []);
      byBuilding.get(r.building).push(r);
    });
    return [...byBuilding.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [rooms, query]);

  const handleSelect = (room) => {
    onSelect(room.room_id);
    setOpen(false);
    setQuery('');
  };

  const handleOpenManage = () => {
    setOpen(false);
    setQuery('');
    onOpenManageRooms?.();
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
      >
        <span className={selectedRoom ? 'text-gray-900' : 'text-gray-400'}>
          {selectedRoom ? formatRoom(selectedRoom) : 'Select a room'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 p-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {/* eslint-disable-next-line jsx-a11y/no-autofocus -- opening the combobox should focus search immediately */}
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search room code, name, or building..."
                className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
              />
            </div>
          </div>

          {groups.length === 0 ? (
            <p className="p-3 text-center text-xs text-gray-500">No rooms match &ldquo;{query}&rdquo;.</p>
          ) : (
            groups.map(([building, buildingRooms]) => (
              <div key={building}>
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide sticky top-0 bg-white">
                  {building}
                </p>
                {buildingRooms.map((room) => (
                  <button
                    type="button"
                    key={room.room_id}
                    onClick={() => handleSelect(room)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-[#80172B]/5 transition-colors ${
                      String(room.room_id) === String(value) ? 'bg-[#80172B]/10' : ''
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="text-sm font-semibold text-gray-900">{room.room_code}</span>
                      {room.room_name && <span className="text-xs text-gray-500"> &middot; {room.room_name}</span>}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0">{room.room_type}</span>
                  </button>
                ))}
              </div>
            ))
          )}

          {/* Always available, not just when search comes up empty - a room missing from
              the list should never be a dead end inside Add Schedule. */}
          {onOpenManageRooms && (
            <button
              type="button"
              onClick={handleOpenManage}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#80172B] hover:bg-[#80172B]/5 transition-colors border-t border-gray-100 sticky bottom-0 bg-white"
            >
              <Settings className="w-3.5 h-3.5" />
              + Add / Manage Rooms
            </button>
          )}
        </div>
      )}
    </div>
  );
}
