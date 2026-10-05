import { useEffect, useMemo, useState } from 'react';
import { X, Save, Pencil, Building2, Archive, ArchiveRestore, AlertTriangle, Search, Settings2, Plus } from 'lucide-react';
import api from '../../../services/api';
import ConfirmDialog from './ConfirmDialog';

const FIELD_DEFAULTS = { room_code: '', room_name: '', building: '', room_type: '' };

// The Room masterlist admins pick from in Add Schedule's Room combobox (see
// RoomCombobox.jsx) - kept as one structured catalog instead of free-typed text.
export default function ManageRoomsModal({ open, onClose, onChanged }) {
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]); // includes archived - for duplicate detection
  const [archivedRooms, setArchivedRooms] = useState([]);
  const [viewingArchived, setViewingArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [editing, setEditing] = useState(null); // room being edited, or {} for new
  const [form, setForm] = useState(FIELD_DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [pendingArchive, setPendingArchive] = useState(null);
  const [buildingFilter, setBuildingFilter] = useState('');

  // Room Type is its own small managed masterlist (see RoomTypeController) - an admin can
  // add a new one or archive one right from here instead of being stuck with a fixed list.
  const [roomTypes, setRoomTypes] = useState([]);
  const [archivedRoomTypes, setArchivedRoomTypes] = useState([]);
  const [managingTypes, setManagingTypes] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [typeError, setTypeError] = useState(null);
  const [typeSubmitting, setTypeSubmitting] = useState(false);
  const [pendingTypeAction, setPendingTypeAction] = useState(null);

  const loadRoomTypes = () => {
    api.get('/room-types').then((res) => setRoomTypes(res.data)).catch(() => setRoomTypes([]));
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get('/rooms').then((res) => setRooms(res.data)).catch(() => setRooms([])).finally(() => setLoading(false));
    api.get('/rooms', { params: { all: 1 } }).then((res) => setAllRooms(res.data)).catch(() => setAllRooms([]));
    loadRoomTypes();
  }, [open]);

  useEffect(() => {
    if (!open || !managingTypes) return;
    api.get('/room-types', { params: { archived: 1 } }).then((res) => setArchivedRoomTypes(res.data)).catch(() => setArchivedRoomTypes([]));
  }, [open, managingTypes]);

  useEffect(() => {
    if (!open || !viewingArchived) return;
    setArchivedLoading(true);
    api
      .get('/rooms', { params: { archived: 1 } })
      .then((res) => setArchivedRooms(res.data))
      .catch(() => setArchivedRooms([]))
      .finally(() => setArchivedLoading(false));
  }, [open, viewingArchived]);

  const normalizeCode = (code) => code.trim().toUpperCase().replace(/[\s-]+/g, '');

  const duplicateMatch = useMemo(() => {
    const code = form.room_code.trim();
    if (!code) return null;
    const normalized = normalizeCode(code);
    return allRooms.find((r) => r.room_id !== editing?.room_id && normalizeCode(r.room_code) === normalized) || null;
  }, [form.room_code, allRooms, editing]);

  // If the room being edited has a type that got archived since it was set, still show it
  // as the selected option instead of silently landing on a blank/invalid selection.
  const typeOptionsForSelect = useMemo(() => {
    if (!form.room_type || roomTypes.some((t) => t.name === form.room_type)) return roomTypes;
    return [...roomTypes, { room_type_id: `stale-${form.room_type}`, name: form.room_type }];
  }, [roomTypes, form.room_type]);

  const buildingOptions = useMemo(
    () => [...new Set(rooms.map((r) => r.building))].sort((a, b) => a.localeCompare(b)),
    [rooms]
  );

  const filterList = (list) => {
    const keyword = search.trim().toLowerCase();
    return list.filter((r) => {
      if (buildingFilter && r.building !== buildingFilter) return false;
      if (!keyword) return true;
      return `${r.room_code} ${r.room_name || ''} ${r.building}`.toLowerCase().includes(keyword);
    });
  };

  const visibleRooms = filterList(rooms);
  const visibleArchivedRooms = filterList(archivedRooms);

  if (!open) return null;

  const startAdd = () => {
    setEditing({});
    setForm(FIELD_DEFAULTS);
    setError(null);
  };
  const startEdit = (room) => {
    setEditing(room);
    setForm({
      room_code: room.room_code,
      room_name: room.room_name || '',
      building: room.building,
      room_type: room.room_type,
    });
    setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const request = editing.room_id
      ? api.put(`/rooms/${editing.room_id}`, form)
      : api.post('/rooms', form);

    request
      .then((res) => {
        setRooms((prev) =>
          prev.some((r) => r.room_id === res.data.room_id) ? prev.map((r) => (r.room_id === res.data.room_id ? res.data : r)) : [...prev, res.data]
        );
        setAllRooms((prev) =>
          prev.some((r) => r.room_id === res.data.room_id) ? prev.map((r) => (r.room_id === res.data.room_id ? res.data : r)) : [...prev, res.data]
        );
        setEditing(null);
        onChanged?.();
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to save that room.'))
      .finally(() => setSubmitting(false));
  };

  // Soft archive: the room row (and every schedule that points at it) is kept; it only moves
  // from the active list to the archived list.
  const confirmArchive = () => {
    const room = pendingArchive;
    setPendingArchive(null);
    api
      .patch(`/rooms/${room.room_id}/archive`)
      .then((res) => {
        setRooms((prev) => prev.filter((r) => r.room_id !== room.room_id));
        setAllRooms((prev) => prev.map((r) => (r.room_id === room.room_id ? res.data : r)));
        setArchivedRooms((prev) => [...prev, res.data]);
        onChanged?.();
      })
      .catch(() => setError('Unable to archive that room.'));
  };

  const handleRestore = (room) => {
    api
      .patch(`/rooms/${room.room_id}/restore`)
      .then((res) => {
        setArchivedRooms((prev) => prev.filter((r) => r.room_id !== room.room_id));
        setRooms((prev) => [...prev, res.data]);
        setAllRooms((prev) => prev.map((r) => (r.room_id === room.room_id ? res.data : r)));
        onChanged?.();
      })
      .catch(() => setError('Unable to restore that room.'));
  };

  const handleAddType = (e) => {
    e.preventDefault();
    const name = newTypeName.trim();
    if (!name) return;
    setTypeError(null);
    setTypeSubmitting(true);
    api
      .post('/room-types', { name })
      .then((res) => {
        setRoomTypes((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
        setForm((f) => ({ ...f, room_type: f.room_type || res.data.name }));
        setNewTypeName('');
      })
      .catch((err) => setTypeError(err.response?.data?.message || 'Unable to add that room type.'))
      .finally(() => setTypeSubmitting(false));
  };

    const askArchiveType = (type) =>
    setPendingTypeAction({
      title: 'Archive Room Type?',
      message: 'This room type will be archived. Existing room and schedule records will not be deleted.',
      confirmLabel: 'Archive',
      tone: 'warning',
      run: () => archiveType(type),
    });

  const archiveType = (type) => {
    api
      .patch(`/room-types/${type.room_type_id}/archive`)
      .then((res) => {
        setRoomTypes((prev) => prev.filter((t) => t.room_type_id !== type.room_type_id));
        setArchivedRoomTypes((prev) => [...prev, res.data]);
      })
      .catch(() => setTypeError('Unable to archive that room type.'));
  };

  const handleRestoreType = (type) => {
    api
      .patch(`/room-types/${type.room_type_id}/restore`)
      .then((res) => {
        setArchivedRoomTypes((prev) => prev.filter((t) => t.room_type_id !== type.room_type_id));
        setRoomTypes((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => setTypeError('Unable to restore that room type.'));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-2xl w-full p-6 relative max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Manage Rooms</h2>
        <div className="flex items-center justify-between gap-3 mb-5">
          <p className="text-sm text-gray-500">The room masterlist used across every timetable.</p>
          {!editing && (
            <button
              type="button"
              onClick={() => setViewingArchived((v) => !v)}
              className="text-xs font-semibold text-[#80172B] hover:underline shrink-0"
            >
              {viewingArchived ? 'View Active Rooms' : 'View Archived'}
            </button>
          )}
        </div>

        {!editing && (
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search room code, name, or building..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
              />
            </div>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#80172B]/30 sm:w-52"
            >
              <option value="">All Buildings</option>
              {buildingOptions.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4 mb-5 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase">Room Code</label>
                <input
                  value={form.room_code}
                  onChange={(e) => setForm((f) => ({ ...f, room_code: e.target.value }))}
                  required
                  placeholder="e.g. BA-101"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase">Room Name (optional)</label>
                <input
                  value={form.room_name}
                  onChange={(e) => setForm((f) => ({ ...f, room_name: e.target.value }))}
                  placeholder="e.g. Computer Lab 1"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase">Building</label>
                <input
                  value={form.building}
                  onChange={(e) => setForm((f) => ({ ...f, building: e.target.value }))}
                  required
                  placeholder="e.g. IT Building"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase">Room Type</label>
                  <button
                    type="button"
                    onClick={() => setManagingTypes((v) => !v)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#80172B] hover:underline"
                  >
                    <Settings2 className="w-3 h-3" />
                    Manage Types
                  </button>
                </div>
                <select
                  value={form.room_type}
                  onChange={(e) => setForm((f) => ({ ...f, room_type: e.target.value }))}
                  required
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
                >
                  <option value="" disabled>Select a type</option>
                  {typeOptionsForSelect.map((t) => (
                    <option key={t.room_type_id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {managingTypes && (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {roomTypes.map((t) => (
                    <span key={t.room_type_id} className="flex items-center gap-1 bg-white border border-gray-300 text-xs text-gray-700 pl-2 pr-1 py-1 rounded-full">
                      {t.name}
                      <button
                        type="button"
                        onClick={() => askArchiveType(t)}
                        title="Archive this type"
                        className="text-gray-400 hover:text-amber-600 transition-colors"
                      >
                        <Archive className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <form onSubmit={handleAddType} className="flex items-center gap-2">
                  <input
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="e.g. Music Room"
                    className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#80172B]/30"
                  />
                  <button
                    type="submit"
                    disabled={typeSubmitting || !newTypeName.trim()}
                    className="flex items-center gap-1 bg-[#80172B] text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-[#651020] transition-colors disabled:opacity-60"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </form>

                {typeError && <p className="text-xs text-rose-600">{typeError}</p>}

                {archivedRoomTypes.length > 0 && (
                  <div className="pt-1 border-t border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1.5 mb-1">Archived Types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {archivedRoomTypes.map((t) => (
                        <button
                          type="button"
                          key={t.room_type_id}
                          onClick={() => handleRestoreType(t)}
                          title="Restore this type"
                          className="flex items-center gap-1 bg-white border border-gray-200 text-xs text-gray-400 pl-2 pr-1.5 py-1 rounded-full hover:text-[#80172B] hover:border-[#80172B] transition-colors"
                        >
                          {t.name}
                          <ArchiveRestore className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {duplicateMatch && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  {duplicateMatch.archived_at ? 'This code was already used by an archived room: ' : 'A room with a matching code already exists: '}
                  <strong>{duplicateMatch.room_code}</strong> ({duplicateMatch.building})
                  {duplicateMatch.archived_at ? '. Restore it (View Archived) instead of creating a new one.' : '. Use a different code, or edit that one instead.'}
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
            + Add Room
          </button>
        ) : null}

        {editing ? null : viewingArchived ? (
          archivedLoading ? (
            <p className="text-sm text-gray-500">Loading archived rooms...</p>
          ) : visibleArchivedRooms.length === 0 ? (
            <div className="text-center py-6">
              <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">{archivedRooms.length === 0 ? 'No archived rooms.' : 'No archived rooms match your search.'}</p>
            </div>
          ) : (
            <RoomTable rooms={visibleArchivedRooms} archived onEdit={startEdit} onArchive={setPendingArchive} onRestore={handleRestore} />
          )
        ) : loading ? (
          <p className="text-sm text-gray-500">Loading rooms...</p>
        ) : visibleRooms.length === 0 ? (
          <div className="text-center py-6">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{rooms.length === 0 ? 'No rooms available.' : 'No rooms match your search.'}</p>
          </div>
        ) : (
          <RoomTable rooms={visibleRooms} onEdit={startEdit} onArchive={setPendingArchive} onRestore={handleRestore} />
        )}
      </div>
      <ConfirmDialog
        open={Boolean(pendingTypeAction)}
        title={pendingTypeAction?.title}
        message={pendingTypeAction?.message}
        confirmLabel={pendingTypeAction?.confirmLabel}
        tone={pendingTypeAction?.tone ?? 'default'}
        onConfirm={() => { const a = pendingTypeAction; setPendingTypeAction(null); a.run(); }}
        onCancel={() => setPendingTypeAction(null)}
      />
      <ConfirmDialog
        open={Boolean(pendingArchive)}
        title={`Archive Room ${pendingArchive?.room_code ?? ''}?`}
        message="This room will be moved to Archived Rooms. Existing schedule history will be preserved."
        confirmLabel="Archive Room"
        tone="warning"
        onConfirm={confirmArchive}
        onCancel={() => setPendingArchive(null)}
      />
    </div>
  );
}

function RoomTable({ rooms, archived = false, onEdit, onArchive, onRestore }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left text-[10px] font-bold text-gray-500 uppercase px-3 py-2">Building</th>
            <th className="text-left text-[10px] font-bold text-gray-500 uppercase px-3 py-2">Code</th>
            <th className="text-left text-[10px] font-bold text-gray-500 uppercase px-3 py-2">Name</th>
            <th className="text-left text-[10px] font-bold text-gray-500 uppercase px-3 py-2">Type</th>
            <th className="text-right text-[10px] font-bold text-gray-500 uppercase px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rooms.map((r) => (
            <tr key={r.room_id} className={archived ? 'text-gray-400' : 'text-gray-700'}>
              <td className="px-3 py-2 whitespace-nowrap">{r.building}</td>
              <td className={`px-3 py-2 font-semibold whitespace-nowrap ${archived ? 'text-gray-500' : 'text-gray-900'}`}>{r.room_code}</td>
              <td className="px-3 py-2">{r.room_name || <span className="text-gray-300">&mdash;</span>}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">{r.room_type}</td>
              <td className="px-3 py-2">
                <div className="flex items-center justify-end gap-1">
                  {archived ? (
                    <button onClick={() => onRestore(r)} className="text-gray-400 hover:text-[#80172B] transition-colors p-1" title="Restore room">
                      <ArchiveRestore className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      <button onClick={() => onEdit(r)} className="text-gray-400 hover:text-[#80172B] transition-colors p-1" title="Edit room">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onArchive(r)} className="text-gray-300 hover:text-amber-600 transition-colors p-1" title="Archive room">
                        <Archive className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
