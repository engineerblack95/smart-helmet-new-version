// ==================================================
// Profile Page
// ==================================================

import { useEffect, useState } from 'react';
import { User, Mail, Phone, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Topbar from '../components/layout/Topbar.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import { authService } from '../services/authService.js';
import { getErrorMessage } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ fullName: '', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await authService.getProfile();
        setProfile(data);
        setForm({ fullName: data.fullName || '', phone: data.phone || '' });
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await authService.updateProfile(form);
      toast.success('Profile updated');
      setProfile((p) => ({ ...p, ...updated }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setChangingPw(true);
    try {
      await authService.changePassword(pwForm.currentPassword, pwForm.newPassword);
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <>
      <Topbar title="Profile" subtitle="Your account settings" />

      <div className="p-6 max-w-3xl space-y-6">
        {/* Info card */}
        <Card>
          <CardHeader icon={User} title="Account Information" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-brand-green flex items-center justify-center text-white text-xl font-bold">
              {profile?.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-base font-semibold text-brand-black">{profile?.fullName}</p>
              <p className="text-sm text-brand-gray">{profile?.email}</p>
              <Badge color="green" className="mt-1">{profile?.role}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-brand-gray-border">
            <div>
              <p className="text-xs text-brand-gray">Helmets</p>
              <p className="text-lg font-bold">{profile?._count?.helmets ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-brand-gray">Rides</p>
              <p className="text-lg font-bold">{profile?._count?.rides ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-brand-gray">Violations</p>
              <p className="text-lg font-bold">{profile?._count?.violations ?? 0}</p>
            </div>
          </div>
        </Card>

        {/* Edit profile */}
        <Card>
          <CardHeader icon={Mail} title="Edit Profile" />
          <div className="space-y-4">
            <Input
              label="Full Name"
              icon={User}
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <Input
              label="Phone"
              icon={Phone}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} loading={saving}>
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </Card>

        {/* Change password */}
        <Card>
          <CardHeader icon={Lock} title="Change Password" />
          <div className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              icon={Lock}
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            />
            <Input
              label="New Password"
              type="password"
              icon={Lock}
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            />
            <Input
              label="Confirm New Password"
              type="password"
              icon={Lock}
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
            />
            <div className="flex justify-end">
              <Button onClick={handleChangePassword} loading={changingPw}>
                <Lock className="w-4 h-4" />
                Change Password
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}