// ==================================================
// Register Page
// ==================================================

import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { HardHat, Mail, Lock, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'RIDER',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'At least 6 characters';
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        role: form.role,
      });
      toast.success('Account created!');
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
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-brand-green flex items-center justify-center mb-3">
              <HardHat className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-brand-black">Create account</h1>
            <p className="text-sm text-brand-gray mt-1">Join Smart Helmet System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              icon={User}
              placeholder="John Doe"
              value={form.fullName}
              onChange={update('fullName')}
              error={errors.fullName}
            />
            <Input
              label="Email"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={form.email}
              onChange={update('email')}
              error={errors.email}
            />
            <Input
              label="Phone (optional)"
              icon={Phone}
              placeholder="+250 788 000 000"
              value={form.phone}
              onChange={update('phone')}
            />
            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="At least 6 characters"
              value={form.password}
              onChange={update('password')}
              error={errors.password}
            />
            <Input
              label="Confirm password"
              type="password"
              icon={Lock}
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              error={errors.confirmPassword}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-brand-black">Account type</label>
              <select
                value={form.role}
                onChange={update('role')}
                className="w-full px-3 py-2 border border-brand-gray-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
              >
                <option value="RIDER">Rider</option>
                <option value="OWNER">Owner</option>
              </select>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create account
            </Button>
          </form>

          <p className="text-sm text-center text-brand-gray mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-green font-medium hover:text-brand-green-dark">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}