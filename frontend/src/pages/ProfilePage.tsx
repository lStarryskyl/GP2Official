import React, { useEffect, useState, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
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
  ChevronUp,
  CreditCard,
  Activity,
  Sparkles,
  Camera,
  Zap,
  Star
} from 'lucide-react';

interface CardSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  delay?: number;
  isVisible?: boolean;
}

const CardSection: React.FC<CardSectionProps> = ({ title, icon: Icon, children, defaultOpen = true, delay = 0, isVisible = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div 
      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-acorn-blue-100 to-acorn-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            <Icon className="w-6 h-6 text-acorn-blue-600" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>
        </div>
        <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-all duration-300 ${isOpen ? 'rotate-180 bg-acorn-blue-100' : ''}`}>
          <ChevronDown className={`w-5 h-5 ${isOpen ? 'text-acorn-blue-600' : 'text-gray-400'}`} />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 border-t border-gray-100">{children}</div>
      </div>
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const observerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [form, setForm] = useState({
    full_name: '',
    job_title: '',
    bio: '',
    contact_email: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(observerRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [loading]);

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
          <div className="text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-acorn-blue-500 to-acorn-orange-500 rounded-full animate-ping opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-r from-acorn-blue-500 to-acorn-orange-500 rounded-full animate-pulse flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-white" />
              </div>
            </div>
            <p className="text-xl text-gray-600 animate-pulse">Loading your profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 relative">
        {/* Animated Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-96 h-96 rounded-full bg-acorn-blue-100/20 blur-3xl -top-48 -right-48 animate-float" />
          <div className="absolute w-72 h-72 rounded-full bg-acorn-orange-100/20 blur-3xl -bottom-36 -left-36 animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute w-64 h-64 rounded-full bg-purple-100/20 blur-3xl top-1/2 right-1/4 animate-float" style={{ animationDelay: '6s' }} />
        </div>

        {/* Header */}
        <div 
          id="header"
          ref={(el) => (observerRefs.current['header'] = el)}
          className={`flex items-center justify-between transition-all duration-700 ${
            isVisible['header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-acorn-blue-600 to-acorn-orange-500 bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-gray-500 mt-1">Manage your account and preferences</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className={`font-bold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 ${
              saved 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-gradient-to-r from-acorn-orange-500 to-acorn-orange-600 hover:from-acorn-orange-600 hover:to-acorn-orange-700'
            } text-white`}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>

        {/* Profile Card */}
        <div 
          id="profile-card"
          ref={(el) => (observerRefs.current['profile-card'] = el)}
          className={`bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xl transition-all duration-700 ${
            isVisible['profile-card'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{ transitionDelay: '100ms' }}
        >
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-acorn-blue-500 via-acorn-blue-600 to-acorn-orange-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80')] bg-cover bg-center opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className="w-6 h-6 text-white/20 absolute animate-float" 
                  style={{ 
                    left: `${20 + i * 15}%`, 
                    top: `${30 + (i % 2) * 20}%`,
                    animationDelay: `${i * 0.5}s` 
                  }} 
                />
              ))}
            </div>
          </div>

          {/* Profile Info */}
          <div className="px-8 pb-8 -mt-16 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 bg-gradient-to-br from-acorn-blue-400 to-acorn-orange-400 rounded-full flex items-center justify-center text-4xl font-bold text-white ring-4 ring-white shadow-xl group-hover:scale-105 transition-transform duration-300">
                  {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <button className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors group-hover:scale-110">
                  <Camera className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name || 'User'}</h2>
                <p className="text-gray-500">{profile?.email}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-acorn-blue-100 text-acorn-blue-700 rounded-full text-sm font-medium">
                    <Shield className="w-4 h-4" />
                    {user?.role_label || 'Member'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-acorn-orange-100 text-acorn-orange-700 rounded-full text-sm font-medium">
                    <Zap className="w-4 h-4" />
                    Pro Plan
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div 
          id="sections"
          ref={(el) => (observerRefs.current['sections'] = el)}
          className="space-y-4"
        >
          <CardSection title="Personal Information" icon={UserIcon} isVisible={isVisible['sections']} delay={200}>
            <div className="pt-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-acorn-blue-500 focus:ring-4 focus:ring-acorn-blue-100 transition-all"
                    placeholder="Your full name"
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    value={form.job_title}
                    onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-acorn-blue-500 focus:ring-4 focus:ring-acorn-blue-100 transition-all"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-acorn-blue-500 focus:ring-4 focus:ring-acorn-blue-100 transition-all resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-acorn-blue-500 focus:ring-4 focus:ring-acorn-blue-100 transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </CardSection>

          <CardSection title="Security & Password" icon={Key} defaultOpen={false} isVisible={isVisible['sections']} delay={300}>
            <div className="pt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-acorn-blue-500 focus:ring-4 focus:ring-acorn-blue-100 transition-all"
                  placeholder="Enter current password"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-acorn-blue-500 focus:ring-4 focus:ring-acorn-blue-100 transition-all"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-acorn-blue-500 focus:ring-4 focus:ring-acorn-blue-100 transition-all"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <Button variant="outline" className="border-2 border-acorn-blue-200 text-acorn-blue-600 hover:bg-acorn-blue-50">
                Update Password
              </Button>
            </div>
          </CardSection>

          <CardSection title="Notification Preferences" icon={Bell} defaultOpen={false} isVisible={isVisible['sections']} delay={400}>
            <div className="pt-6 space-y-4">
              {[
                { label: 'Email notifications for project updates', checked: true },
                { label: 'Email notifications for AI generation complete', checked: true },
                { label: 'Weekly digest of project activity', checked: false },
                { label: 'Marketing and product updates', checked: false },
              ].map((item, index) => (
                <label key={index} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="w-5 h-5 text-acorn-blue-600 border-2 border-gray-300 rounded focus:ring-acorn-blue-500 transition-all"
                    />
                  </div>
                  <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{item.label}</span>
                </label>
              ))}
            </div>
          </CardSection>

          <CardSection title="Subscription & Billing" icon={CreditCard} defaultOpen={false} isVisible={isVisible['sections']} delay={500}>
            <div className="pt-6">
              <div className="bg-gradient-to-r from-acorn-blue-500 to-acorn-orange-500 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80')] bg-cover bg-center opacity-10" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5" />
                      <span className="font-bold text-lg">Pro Plan</span>
                    </div>
                    <p className="text-white/80">Unlimited projects, advanced AI features, priority support</p>
                  </div>
                  <Button className="bg-white text-acorn-blue-600 hover:bg-gray-100 font-bold shadow-lg">
                    Manage Plan
                  </Button>
                </div>
              </div>
            </div>
          </CardSection>

          <CardSection title="Recent Activity" icon={Activity} defaultOpen={false} isVisible={isVisible['sections']} delay={600}>
            <div className="pt-6 space-y-3">
              {[
                { action: 'Created project "E-commerce Platform"', time: '2 hours ago', icon: '🚀' },
                { action: 'Generated SRS document', time: '5 hours ago', icon: '📄' },
                { action: 'Updated profile settings', time: '1 day ago', icon: '⚙️' },
                { action: 'Logged in from new device', time: '3 days ago', icon: '🔐' },
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{item.action}</span>
                  </div>
                  <span className="text-sm text-gray-500">{item.time}</span>
                </div>
              ))}
            </div>
          </CardSection>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
      `}</style>
    </Layout>
  );
};
