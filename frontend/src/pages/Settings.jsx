// ==================================================
// Settings Page — Admin only (Device Key Management)
// ==================================================

import { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Key,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Plus,
  Copy,
  AlertTriangle,
  KeyRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../components/layout/Topbar.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Modal from '../components/common/Modal.jsx';
import Spinner from '../components/common/Spinner.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api, getErrorMessage } from '../services/api.js';

export default function Settings() {
  const { user } = useAuth();

  // State
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealedIds, setRevealedIds] = useState(new Set());
  const [newKeyModal, setNewKeyModal] = useState(null); // { apiKey, deviceCode }
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ deviceCode: '', deviceType: 'HELMET' });

  // Load keys on mount (only for admins)
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadKeys();
    }
  }, [user]);

  if (user?.role !== 'ADMIN') {
    return (
      <>
        <Topbar title="Settings" />
        <div className="p-6">
          <Card>
            <div className="flex items-center gap-3 py-8 justify-center">
              <Shield className="w-6 h-6 text-red-600" />
              <p className="text-sm text-brand-gray">Admin access required.</p>
            </div>
          </Card>
        </div>
      </>
    );
  }

  const loadKeys = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/device-keys');
      setKeys(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleReveal = async (key) => {
    if (revealedIds.has(key.id)) {
      const next = new Set(revealedIds);
      next.delete(key.id);
      setRevealedIds(next);
      return;
    }
    try {
      const { data } = await api.get(`/device-keys/${key.id}/reveal`);
      // Replace the masked key with the real one in state
      setKeys((prev) =>
        prev.map((k) => (k.id === key.id ? { ...k, apiKey: data.data.apiKey } : k))
      );
      setRevealedIds(new Set([...revealedIds, key.id]));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const copyKey = (apiKey) => {
    navigator.clipboard.writeText(apiKey);
    toast.success('API Key copied to clipboard');
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/device-keys', form);
      setNewKeyModal({ apiKey: data.data.apiKey, deviceCode: data.data.deviceCode });
      setCreateOpen(false);
      setForm({ deviceCode: '', deviceType: 'HELMET' });
      loadKeys();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleRotate = async (key) => {
    if (!confirm(`Rotate key for ${key.deviceCode}? The old key will stop working immediately.`)) return;
    try {
      const { data } = await api.put(`/device-keys/${key.id}/rotate`);
      setNewKeyModal({ apiKey: data.data.apiKey, deviceCode: data.data.deviceCode });
      loadKeys();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRevoke = async (key) => {
    if (!confirm(`Revoke key for ${key.deviceCode}? The device will be blocked.`)) return;
    try {
      await api.delete(`/device-keys/${key.id}/revoke`);
      toast.success('Key revoked successfully');
      loadKeys();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <Topbar title="Settings" subtitle="System configuration (Admin)" />

      <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
        {/* --- Your Account --- */}
        <Card>
          <CardHeader icon={User} title="Your Account" subtitle="Signed in as administrator" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-brand-gray-border">
              <span className="text-brand-gray">Name</span>
              <span className="font-medium">{user?.fullName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-brand-gray-border">
              <span className="text-brand-gray">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-brand-gray">Role</span>
              <Badge color="green">{user?.role}</Badge>
            </div>
          </div>
        </Card>

        {/* --- Device API Keys --- */}
        <Card>
          <CardHeader
            icon={Key}
            title="Device API Keys"
            subtitle="Authenticate helmet and bike hardware"
          />

          {/* Amber Warning Box */}
          <div className="flex items-start gap-3 bg-brand-amber-light border border-brand-amber/30 rounded-lg p-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-brand-amber-dark shrink-0 mt-0.5" />
            <p className="text-xs text-brand-amber-dark font-medium">
              Treat these keys like passwords. Never commit them to Git, share them in screenshots, or post them publicly.
            </p>
          </div>

          {loading ? (
            <Spinner />
          ) : (
            <div className="space-y-3">
              {keys.length === 0 ? (
                <p className="text-sm text-brand-gray text-center py-4">No device keys found.</p>
              ) : (
                keys.map((key) => {
                  const isRevealed = revealedIds.has(key.id);
                  return (
                    <div
                      key={key.id}
                      className="p-4 border border-brand-gray-border rounded-lg bg-brand-gray-light"
                    >
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-black">
                            {key.deviceCode}
                          </span>
                          <Badge color={key.deviceType === 'HELMET' ? 'green' : 'gray'}>
                            {key.deviceType}
                          </Badge>
                          <Badge color={key.isActive ? 'green' : 'red'}>
                            {key.isActive ? 'Active' : 'Revoked'}
                          </Badge>
                        </div>
                        <span className="text-xs text-brand-gray">
                          {key.lastUsedAt
                            ? `Last used ${new Date(key.lastUsedAt).toLocaleString()}`
                            : 'Never used'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <code className="flex-1 p-2 bg-white border border-brand-gray-border rounded text-xs font-mono break-all">
                          {key.apiKey}
                        </code>
                        <button
                          onClick={() => toggleReveal(key)}
                          className="p-2 rounded-lg hover:bg-brand-green-light transition-colors"
                          title={isRevealed ? 'Hide key' : 'Reveal key'}
                        >
                          {isRevealed ? (
                            <EyeOff className="w-4 h-4 text-brand-green-dark" />
                          ) : (
                            <Eye className="w-4 h-4 text-brand-gray" />
                          )}
                        </button>
                        <button
                          onClick={() => copyKey(key.apiKey)}
                          className="p-2 rounded-lg hover:bg-brand-green-light transition-colors"
                          title="Copy key"
                          disabled={!isRevealed}
                          style={{ opacity: isRevealed ? 1 : 0.4 }}
                        >
                          <Copy className="w-4 h-4 text-brand-gray" />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => handleRotate(key)}>
                          <RefreshCw className="w-3.5 h-3.5" /> Rotate
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRevoke(key)}
                          className="text-red-600 hover:bg-red-50"
                          disabled={!key.isActive}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Revoke
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}

              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4" /> Generate New Device Key
              </Button>
            </div>
          )}
        </Card>

        {/* --- System Info --- */}
        <Card>
          <CardHeader
            icon={SettingsIcon}
            title="System Info"
            subtitle="Build and environment details"
          />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-brand-gray-border">
              <span className="text-brand-gray">API URL</span>
              <span className="font-mono text-xs">{import.meta.env.VITE_API_URL}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-brand-gray-border">
              <span className="text-brand-gray">Socket URL</span>
              <span className="font-mono text-xs">{import.meta.env.VITE_SOCKET_URL}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-brand-gray">Alcohol Threshold</span>
              <span className="font-medium">400 (raw MQ-3)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ==============================
          Create Key Modal
          ============================== */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Generate New Device Key"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>Generate Key</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Device Code"
            placeholder="e.g. H002 or B002"
            value={form.deviceCode}
            onChange={(e) => setForm({ ...form, deviceCode: e.target.value.toUpperCase() })}
          />
          <div>
            <label className="block text-sm font-medium text-brand-black mb-1">Device Type</label>
            <select
              value={form.deviceType}
              onChange={(e) => setForm({ ...form, deviceType: e.target.value })}
              className="w-full px-3 py-2 border border-brand-gray-border rounded-lg text-sm"
            >
              <option value="HELMET">HELMET</option>
              <option value="BIKE">BIKE</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* ==============================
          New Key Modal (shown ONCE)
          ============================== */}
      <Modal
        isOpen={!!newKeyModal}
        onClose={() => setNewKeyModal(null)}
        title={
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand-green-dark" />
            <span>Copy Your New API Key Now</span>
          </div>
        }
        footer={
          <Button onClick={() => setNewKeyModal(null)} className="w-full">
            I've copied it
          </Button>
        }
      >
        <div className="space-y-4">
          {/* Red Warning Box */}
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700 mb-1">
                This key will NOT be shown again
              </p>
              <p className="text-xs text-red-600">
                Copy it now and add it to your firmware. If you lose it, you'll need to rotate again.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-brand-gray mb-1">
              Key for <strong className="text-brand-black">{newKeyModal?.deviceCode}</strong>:
            </p>
            <div className="p-3 bg-brand-black rounded-lg">
              <code className="text-xs font-mono text-white break-all">
                {newKeyModal?.apiKey}
              </code>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => {
              navigator.clipboard.writeText(newKeyModal.apiKey);
              toast.success('Copied to clipboard');
            }}
            className="w-full"
          >
            <Copy className="w-4 h-4" /> Copy Key
          </Button>
        </div>
      </Modal>
    </>
  );
}