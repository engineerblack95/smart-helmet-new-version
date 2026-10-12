// ==================================================
// Settings Page — Admin only
// ==================================================

import { Settings as SettingsIcon, User, Key, Shield } from 'lucide-react';
import Topbar from '../components/layout/Topbar.jsx';
import Card, { CardHeader } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Settings() {
  const { user } = useAuth();

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

  return (
    <>
      <Topbar title="Settings" subtitle="System configuration (Admin)" />

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader
            icon={User}
            title="Your Account"
            subtitle="Signed in as administrator"
          />
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

        <Card>
          <CardHeader
            icon={Key}
            title="Device API Keys"
            subtitle="Used by ESP32 / helmet firmware"
          />
          <div className="space-y-3 text-sm">
            <p className="text-brand-gray">
              Device API keys are stored in the database. To view or rotate them, run:
            </p>
            <pre className="bg-brand-gray-light p-3 rounded-lg text-xs font-mono overflow-x-auto">
              npx prisma studio
            </pre>
            <p className="text-brand-gray">
              Or re-seed to regenerate: <code className="bg-brand-gray-light px-1.5 py-0.5 rounded">npm run prisma:seed</code>
            </p>
          </div>
        </Card>

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
              <span className="font-medium">300 (raw MQ-3)</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}