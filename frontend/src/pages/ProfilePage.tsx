import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import type { User } from '@/types';
import {
  User as UserIcon,
  Mail,
  Shield,
  Bell,
  Key,
  Save,
  Loader2,
  CheckCircle,
  ChevronDown,
  CreditCard,
  Activity,
  Sparkles,
  Camera,
  Zap,
  Briefcase,
  Globe,
} from 'lucide-react';

/* ─── Collapsible Card Section ─── */
interface CardSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}

const CardSection: React.FC<CardSectionProps> = ({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
  accentColor = 'var(--blue-400)',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-[var(--brand-700)]/60 overflow-hidden bg-[var(--brand-850)] transition-shadow duration-300 hover:shadow-lg hover:shadow-[rgba(26,111,212,0.08)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 transition-colors hover:bg-[var(--brand-800)]/60 group"
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${accentColor} 25%, transparent)`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <h3 className="font-semibold text-[15px] text-[var(--text-primary)]">{title}</h3>
        </div>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? 'bg-[rgba(26,111,212,0.15)] rotate-180'
              : 'bg-[var(--brand-700)]/50'
          }`}
        >
          <ChevronDown
            className={`w-4 h-4 transition-colors ${
              isOpen ? 'text-[var(--blue-400)]' : 'text-[var(--text-muted)]'
            }`}
          />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-400 ease-in-out ${
          isOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-5 sm:px-6 sm:pb-6 border-t border-[var(--brand-700)]/40">
          {children}
        </div>
      </div>
    </div>
  );
};

/* ─── Styled Input ─── */
const inputClasses =
  'w-full px-4 py-3 rounded-xl border border-[var(--brand-700)] bg-[#152238] text-[var(--text-primary)] placeholder-[var(--text-muted)]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--blue-400)]/40 focus:border-[var(--blue-400)] transition-all';

/* ─── Profile Page ─── */
const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    job_title: '',
    bio: '',
    contact_email: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getProfile();
      setProfile(data);
      setForm({
        full_name: data.full_name || '',
        job_title: data.job_title || '',
        bio: data.bio || '',
        contact_email: data.contact_email || data.email || '',
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess(false);
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordError('All password fields are required.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    try {
      setPasswordSaving(true);
      await api.changePassword(passwordForm.current_password, passwordForm.new_password, passwordForm.confirm_password);
      setPasswordSuccess(true);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Password updated successfully!');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to update password.';
      setPasswordError(msg);
    } finally {
      setPasswordSaving(false);
    }
  };

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--blue-400)] to-[#0d2b52] flex items-center justify-center animate-pulse">
                <UserIcon className="w-10 h-10 text-white/90" />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-[var(--blue-400)]/20 blur-xl animate-pulse" />
            </div>
            <p className="text-[var(--text-muted)]">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const initials = (profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Profile Settings
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Manage your account and preferences
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
<<<<<<< HEAD
            className={`font-bold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 ${
              saved 
                ? 'bg-blue-900/200 hover:bg-blue-500' 
                : 'bg-gradient-to-r from-acorn-orange-500 to-acorn-orange-600 hover:from-acorn-orange-600 hover:to-acorn-orange-700'
            } text-white`}
=======
            className={`transition-all duration-300 ${
              saved
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                : ''
            }`}
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>

        {/* ── Profile Hero Card ── */}
        <div className="rounded-2xl border border-[var(--brand-700)]/60 overflow-hidden bg-[var(--brand-850)] shadow-lg">
          {/* Banner */}
          <div className="h-28 sm:h-36 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d2b52] via-[var(--blue-400)] to-[#1a3a5c]" />
            {/* Decorative grid dots */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            {/* Glow accent */}
            <div className="absolute -bottom-12 left-1/3 w-64 h-32 bg-[var(--blue-400)]/20 rounded-full blur-3xl" />
          </div>

          {/* Profile Info */}
          <div className="px-5 sm:px-8 pb-6 sm:pb-8 -mt-14 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
              {/* Avatar */}
              <div className="relative group flex-shrink-0">
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[var(--blue-400)] to-[#0d2b52] flex items-center justify-center text-4xl font-bold text-white ring-4 ring-[var(--brand-850)] shadow-xl transition-transform duration-300 group-hover:scale-[1.03]">
                  {initials}
                </div>
                <button
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-xl bg-[var(--brand-800)] border border-[var(--brand-700)] shadow-lg flex items-center justify-center transition-all hover:bg-[var(--brand-700)] hover:scale-110"
                  title="Change avatar"
                >
                  <Camera className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              </div>

              {/* User info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] truncate">
                  {profile?.full_name || 'User'}
                </h2>
                <p className="text-sm text-[var(--text-muted)] flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{profile?.email}</span>
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[rgba(26,111,212,0.15)] text-[var(--blue-300)] border border-[rgba(26,111,212,0.25)]">
                    <Shield className="w-3.5 h-3.5" />
                    {(user as any)?.role_label || 'Member'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[rgba(249,115,22,0.12)] text-[#F97316] border border-[rgba(249,115,22,0.25)]">
                    <Zap className="w-3.5 h-3.5" />
                    Pro Plan
                  </span>
                  {profile?.job_title && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[var(--brand-700)]/50 text-[var(--text-muted)] border border-[var(--brand-700)]">
                      <Briefcase className="w-3.5 h-3.5" />
                      {profile.job_title}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Settings Sections ── */}
        <div className="space-y-4">
          {/* Personal Information */}
          <CardSection title="Personal Information" icon={UserIcon} accentColor="var(--blue-400)">
            <div className="pt-5 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className={inputClasses}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={form.job_title}
                    onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                    className={inputClasses}
                    placeholder="e.g. Product Manager"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                  Bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className={`${inputClasses} resize-none`}
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  className={inputClasses}
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </CardSection>

          {/* Security & Password */}
          <CardSection title="Security & Password" icon={Key} defaultOpen={false} accentColor="#F97316">
            <div className="pt-5 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => { setPasswordSuccess(false); setPasswordForm({ ...passwordForm, current_password: e.target.value }); }}
                  className={inputClasses}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => { setPasswordSuccess(false); setPasswordForm({ ...passwordForm, new_password: e.target.value }); }}
                    className={inputClasses}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => { setPasswordSuccess(false); setPasswordForm({ ...passwordForm, confirm_password: e.target.value }); }}
                    className={inputClasses}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  Password updated successfully!
                </div>
              )}

              <Button
                onClick={handlePasswordChange}
                disabled={passwordSaving}
              >
                {passwordSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating…</>
                ) : (
                  <><Key className="w-4 h-4 mr-2" />Update Password</>
                )}
              </Button>

              <p className="text-xs text-gray-400">
                Password must be at least 8 characters and include uppercase, lowercase, and a number.
              </p>
            </div>
          </CardSection>

          {/* Notification Preferences */}
          <CardSection title="Notification Preferences" icon={Bell} defaultOpen={false} accentColor="#22c55e">
            <div className="pt-5 space-y-1">
              {[
                { label: 'Email notifications for project updates', checked: true },
                { label: 'Email notifications for AI generation complete', checked: true },
                { label: 'Weekly digest of project activity', checked: false },
                { label: 'Marketing and product updates', checked: false },
              ].map((item, index) => (
                <label
                  key={index}
                  className="flex items-center gap-3.5 px-3 py-3 rounded-xl cursor-pointer transition-colors hover:bg-[var(--brand-800)]/60 group"
                >
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="appearance-none w-5 h-5 rounded-md border-2 border-[var(--brand-600)] bg-[#152238] checked:bg-[var(--blue-400)] checked:border-[var(--blue-400)] transition-all cursor-pointer focus:ring-2 focus:ring-[var(--blue-400)]/40 focus:ring-offset-0"
                    />
                    <CheckCircle className="absolute w-3.5 h-3.5 text-[var(--brand-900)] left-[3px] top-[3px] pointer-events-none opacity-0 [input:checked~&]:opacity-100" />
                  </div>
                  <span className="text-sm text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </CardSection>

          {/* Subscription & Billing */}
          <CardSection title="Subscription & Billing" icon={CreditCard} defaultOpen={false} accentColor="#a855f7">
            <div className="pt-5">
              <div className="rounded-xl border border-[rgba(26,111,212,0.25)] overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0d2b52] via-[rgba(26,111,212,0.2)] to-[#1a3a5c]" />
                {/* Decorative grid */}
                <div
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-5 h-5 text-[var(--blue-400)]" />
                      <span className="font-bold text-[var(--text-primary)]">Pro Plan</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                      Unlimited projects, advanced AI features, priority support
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="flex-shrink-0">
                    <Globe className="w-4 h-4 mr-2" />
                    Manage Plan
                  </Button>
                </div>
              </div>
            </div>
          </CardSection>

          {/* Recent Activity */}
          <CardSection title="Recent Activity" icon={Activity} defaultOpen={false} accentColor="#eab308">
            <div className="pt-5 space-y-1">
              {[
                { action: 'Created project "E-commerce Platform"', time: '2 hours ago', icon: '🚀' },
                { action: 'Generated SRS document', time: '5 hours ago', icon: '📄' },
                { action: 'Updated profile settings', time: '1 day ago', icon: '⚙️' },
                { action: 'Logged in from new device', time: '3 days ago', icon: '🔐' },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-3 rounded-xl transition-colors hover:bg-[var(--brand-800)]/60 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <span className="text-sm text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                      {item.action}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]/70 flex-shrink-0 ml-4">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </CardSection>
        </div>

        {/* Bottom spacer for floating elements */}
        <div className="h-4" />
      </div>
    </Layout>
  );
};

export default ProfilePage;
export { ProfilePage };
