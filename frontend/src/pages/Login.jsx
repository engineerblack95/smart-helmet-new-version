// ==================================================
// Login Page
// ==================================================

import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { HardHat, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gray-light p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-brand-gray-border rounded-2xl shadow-soft p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-brand-green flex items-center justify-center mb-3">
              <HardHat className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-brand-black">Smart Helmet</h1>
            <p className="text-sm text-brand-gray mt-1">Monitoring System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          {/* Register link */}
          <p className="text-sm text-center text-brand-gray mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-green font-medium hover:text-brand-green-dark">
              Create one
            </Link>
          </p>
        </div>

        {/* Test credentials */}
        <div className="mt-4 p-4 rounded-xl bg-white border border-brand-gray-border">
          <p className="text-xs font-semibold text-brand-black mb-2">Test credentials</p>
          <div className="space-y-1 text-xs text-brand-gray font-mono">
            <p>admin@smarthelmet.com / admin123</p>
            <p>owner@smarthelmet.com / owner123</p>
            <p>rider@smarthelmet.com / rider123</p>
          </div>
        </div>
      </div>
    </div>
  );
}