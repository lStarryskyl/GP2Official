import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import type { User } from '@/types';
import { 
  User as UserIcon, 
  Mail, 
  Building2, 
  Shield, 
  Bell, 
  Key,
  Save,
  Loader2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Activity
} from 'lucide-react';

interface CardSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CardSection: React.FC<CardSectionProps> = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-acorn-blue-50 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-acorn-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {isOpen && <div className="px-5 pb-5 border-t border-gray-100">{children}</div>}
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-acorn-blue-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-acorn-orange-500 hover:bg-acorn-orange-600 text-white"
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

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-acorn-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-acorn-blue-600">
              {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || 'User'}</h2>
              <p className="text-gray-500">{profile?.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-acorn-blue-50 text-acorn-blue-700 rounded-full text-xs font-medium">
                  <Shield className="w-3 h-3" />
                  {user?.role_label || 'Member'}
                </span>
                <span className="text-sm text-gray-500">
                  {profile?.organization || 'Personal Workspace'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <CardSection title="Personal Information" icon={UserIcon}>
          <div className="pt-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <input
                  type="text"
                  value={form.job_title}
                  onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500"
                  placeholder="e.g. Product Manager"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500 resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500"
                placeholder="your@email.com"
              />
            </div>
          </div>
        </CardSection>

        {/* Security */}
        <CardSection title="Security & Password" icon={Key} defaultOpen={false}>
          <div className="pt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <input
                type="password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500"
                placeholder="Enter current password"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <Button variant="outline" className="border-acorn-blue-200 text-acorn-blue-600">
              Update Password
            </Button>
          </div>
        </CardSection>

        {/* Notifications */}
        <CardSection title="Notification Preferences" icon={Bell} defaultOpen={false}>
          <div className="pt-5 space-y-4">
            {[
              { label: 'Email notifications for project updates', checked: true },
              { label: 'Email notifications for AI generation complete', checked: true },
              { label: 'Weekly digest of project activity', checked: false },
              { label: 'Marketing and product updates', checked: false },
            ].map((item, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={item.checked}
                  className="w-4 h-4 text-acorn-blue-600 border-gray-300 rounded focus:ring-acorn-blue-500"
                />
                <span className="text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </CardSection>

        {/* Subscription */}
        <CardSection title="Subscription & Billing" icon={CreditCard} defaultOpen={false}>
          <div className="pt-5">
            <div className="bg-acorn-blue-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-acorn-blue-900">Free Plan</p>
                <p className="text-sm text-acorn-blue-700">5 projects, basic AI features</p>
              </div>
              <Button className="bg-acorn-orange-500 hover:bg-acorn-orange-600 text-white">
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </CardSection>

        {/* Activity Log */}
        <CardSection title="Recent Activity" icon={Activity} defaultOpen={false}>
          <div className="pt-5 space-y-3">
            {[
              { action: 'Created project "E-commerce Platform"', time: '2 hours ago' },
              { action: 'Generated SRS document', time: '5 hours ago' },
              { action: 'Updated profile settings', time: '1 day ago' },
              { action: 'Logged in from new device', time: '3 days ago' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-700">{item.action}</span>
                <span className="text-sm text-gray-500">{item.time}</span>
              </div>
            ))}
          </div>
        </CardSection>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </Layout>
  );
};
