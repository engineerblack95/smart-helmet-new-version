// ==================================================
// Helmets Page — CRUD
// ==================================================

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, HardHat } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../components/layout/Topbar.jsx';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import Input from '../components/common/Input.jsx';
import Modal from '../components/common/Modal.jsx';
import Spinner from '../components/common/Spinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { helmetService } from '../services/helmetService.js';
import { getErrorMessage } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { timeAgo } from '../utils/formatters.js';
import { STATUS_COLORS } from '../utils/constants.js';

export default function Helmets() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'OWNER';
  const isAdmin = user?.role === 'ADMIN';

  const [helmets, setHelmets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ helmetCode: '', batteryLevel: 100, firmwareVer: '1.0.0' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await helmetService.list();
      setHelmets(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ helmetCode: '', batteryLevel: 100, firmwareVer: '1.0.0' });
    setModalOpen(true);
  };

  const openEdit = (h) => {
    setEditing(h);
    setForm({
      helmetCode: h.helmetCode,
      batteryLevel: h.batteryLevel,
      firmwareVer: h.firmwareVer || '1.0.0',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.helmetCode.trim()) {
      toast.error('Helmet code is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await helmetService.update(editing.id, {
          batteryLevel: Number(form.batteryLevel),
          firmwareVer: form.firmwareVer,
        });
        toast.success('Helmet updated');
      } else {
        await helmetService.create({
          helmetCode: form.helmetCode.trim(),
          batteryLevel: Number(form.batteryLevel),
          firmwareVer: form.firmwareVer,
        });
        toast.success('Helmet created');
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
      await helmetService.remove(confirmDelete.id);
      toast.success('Helmet deleted');
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <Topbar title="Helmets" subtitle="Manage your smart helmets" />

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-brand-gray">
            {helmets.length} helmet{helmets.length !== 1 ? 's' : ''}
          </p>
          {canEdit && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Add Helmet
            </Button>
          )}
        </div>

        <Card padding={false}>
          {loading ? (
            <Spinner />
          ) : helmets.length === 0 ? (
            <EmptyState
              icon={HardHat}
              title="No helmets yet"
              description="Add your first smart helmet to start monitoring."
              action={
                canEdit && (
                  <Button onClick={openCreate}>
                    <Plus className="w-4 h-4" />
                    Add Helmet
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
                    <th className="px-5 py-3">Owner</th>
                    <th className="px-5 py-3">Battery</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Last Seen</th>
                    {canEdit && <th className="px-5 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {helmets.map((h) => (
                    <tr key={h.id} className="border-b border-brand-gray-border last:border-0 hover:bg-brand-gray-light">
                      <td className="px-5 py-3 font-medium text-brand-black">{h.helmetCode}</td>
                      <td className="px-5 py-3 text-brand-gray">{h.owner?.fullName || '—'}</td>
                      <td className="px-5 py-3 text-brand-gray">{h.batteryLevel}%</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md ${
                            STATUS_COLORS[h.status]
                          }`}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-brand-gray">{timeAgo(h.lastSeenAt)}</td>
                      {canEdit && (
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(h)}
                              className="p-1.5 rounded-lg hover:bg-brand-green-light text-brand-gray hover:text-brand-green-dark transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => setConfirmDelete(h)}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Helmet' : 'Add Helmet'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? 'Save Changes' : 'Create Helmet'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Helmet Code"
            placeholder="e.g. H001"
            value={form.helmetCode}
            onChange={(e) => setForm({ ...form, helmetCode: e.target.value })}
            disabled={!!editing}
            required
          />
          <Input
            label="Battery Level (%)"
            type="number"
            min="0"
            max="100"
            value={form.batteryLevel}
            onChange={(e) => setForm({ ...form, batteryLevel: e.target.value })}
          />
          <Input
            label="Firmware Version"
            value={form.firmwareVer}
            onChange={(e) => setForm({ ...form, firmwareVer: e.target.value })}
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Helmet?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-brand-gray">
          Are you sure you want to delete <strong className="text-brand-black">{confirmDelete?.helmetCode}</strong>?
          This will also remove all its sensor logs and violations. This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}