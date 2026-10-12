// ==================================================
// Bikes Page — CRUD
// ==================================================

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Bike as BikeIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../components/layout/Topbar.jsx';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Modal from '../components/common/Modal.jsx';
import Spinner from '../components/common/Spinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { bikeService } from '../services/bikeService.js';
import { helmetService } from '../services/helmetService.js';
import { getErrorMessage } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { timeAgo } from '../utils/formatters.js';
import { STATUS_COLORS } from '../utils/constants.js';

export default function Bikes() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'OWNER';
  const isAdmin = user?.role === 'ADMIN';

  const [bikes, setBikes] = useState([]);
  const [helmets, setHelmets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ bikeCode: '', plateNumber: '', helmetId: '' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [b, h] = await Promise.all([bikeService.list(), helmetService.list()]);
      setBikes(b);
      setHelmets(h);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ bikeCode: '', plateNumber: '', helmetId: '' });
    setModalOpen(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      bikeCode: b.bikeCode,
      plateNumber: b.plateNumber || '',
      helmetId: b.helmet?.id || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.bikeCode.trim()) {
      toast.error('Bike code is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        plateNumber: form.plateNumber || null,
        helmetId: form.helmetId || null,
      };
      if (editing) {
        await bikeService.update(editing.id, payload);
        toast.success('Bike updated');
      } else {
        await bikeService.create({ ...payload, bikeCode: form.bikeCode.trim() });
        toast.success('Bike created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await bikeService.remove(confirmDelete.id);
      toast.success('Bike deleted');
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <Topbar title="Bikes" subtitle="Manage your motorcycles" />

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-brand-gray">
            {bikes.length} bike{bikes.length !== 1 ? 's' : ''}
          </p>
          {canEdit && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Add Bike
            </Button>
          )}
        </div>

        <Card padding={false}>
          {loading ? (
            <Spinner />
          ) : bikes.length === 0 ? (
            <EmptyState
              icon={BikeIcon}
              title="No bikes yet"
              description="Add your first motorcycle to start pairing helmets."
              action={
                canEdit && (
                  <Button onClick={openCreate}>
                    <Plus className="w-4 h-4" />
                    Add Bike
                  </Button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-brand-gray uppercase border-b border-brand-gray-border">
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Plate</th>
                    <th className="px-5 py-3">Owner</th>
                    <th className="px-5 py-3">Paired Helmet</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Last Seen</th>
                    {canEdit && <th className="px-5 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {bikes.map((b) => (
                    <tr key={b.id} className="border-b border-brand-gray-border last:border-0 hover:bg-brand-gray-light">
                      <td className="px-5 py-3 font-medium text-brand-black">{b.bikeCode}</td>
                      <td className="px-5 py-3 text-brand-gray">{b.plateNumber || '—'}</td>
                      <td className="px-5 py-3 text-brand-gray">{b.owner?.fullName || '—'}</td>
                      <td className="px-5 py-3">
                        {b.helmet?.helmetCode ? (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-brand-green-light text-brand-green-dark">
                            {b.helmet.helmetCode}
                          </span>
                        ) : (
                          <span className="text-brand-gray">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md ${STATUS_COLORS[b.status]}`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-brand-gray">{timeAgo(b.lastSeenAt)}</td>
                      {canEdit && (
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(b)}
                              className="p-1.5 rounded-lg hover:bg-brand-green-light text-brand-gray hover:text-brand-green-dark transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => setConfirmDelete(b)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-brand-gray hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Bike' : 'Add Bike'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? 'Save Changes' : 'Create Bike'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Bike Code"
            placeholder="e.g. B001"
            value={form.bikeCode}
            onChange={(e) => setForm({ ...form, bikeCode: e.target.value })}
            disabled={!!editing}
            required
          />
          <Input
            label="Plate Number"
            placeholder="e.g. RAB 123 A"
            value={form.plateNumber}
            onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-brand-black">Paired Helmet</label>
            <select
              value={form.helmetId}
              onChange={(e) => setForm({ ...form, helmetId: e.target.value })}
              className="w-full px-3 py-2 border border-brand-gray-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
            >
              <option value="">— None —</option>
              {helmets.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.helmetCode}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Bike?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-brand-gray">
          Are you sure you want to delete <strong className="text-brand-black">{confirmDelete?.bikeCode}</strong>?
          This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}