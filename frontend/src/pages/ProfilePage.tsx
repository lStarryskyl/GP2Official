import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import type { User, WorkspaceInvite, SocialLink } from '@/types';
import { ROLE_OPTIONS } from '@/constants/roles';
import { Loader2, Link as LinkIcon, Mail, MapPin, Briefcase, Shield, Send } from 'lucide-react';

const socialFields = [
  { key: 'website', placeholder: 'Personal website' },
  { key: 'linkedin', placeholder: 'LinkedIn URL' },
  { key: 'github', placeholder: 'GitHub URL' },
  { key: 'twitter', placeholder: 'Twitter / X URL' },
];

export const ProfilePage: React.FC = () => {
  const { user, checkAuth } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'program_manager', message: '' });
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    job_title: '',
    bio: '',
    location: '',
    timezone: '',
    pronouns: '',
    avatar_url: '',
    banner_url: '',
    availability: '',
    contact_email: '',
    phone: '',
    skills: '',
    interests: '',
  });
  const [social, setSocial] = useState<Record<string, string>>({
    website: '',
    linkedin: '',
    github: '',
    twitter: '',
  });

  const userAuthority = user?.role_authority || 0;
  const canInvite = userAuthority >= 4;

  const heroStyle = useMemo(
    () =>
      form.banner_url
        ? { backgroundImage: `url(${form.banner_url})` }
        : { backgroundImage: 'linear-gradient(135deg, #c084fc, #6366f1)' },
    [form.banner_url]
  );

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getProfile();
      setProfile(data);
      setForm({
        full_name: data.full_name || '',
        job_title: data.job_title || '',
        bio: data.bio || '',
        location: data.location || '',
        timezone: data.timezone || '',
        pronouns: data.pronouns || '',
        avatar_url: data.avatar_url || '',
        banner_url: data.banner_url || '',
        availability: data.availability || '',
        contact_email: data.contact_email || data.email,
        phone: data.phone || '',
        skills: (data.skills || []).join(', '),
        interests: (data.interests || []).join(', '),
      });
      const links = data.social_links || [];
      const nextSocial: Record<string, string> = {
        website: '',
        linkedin: '',
        github: '',
        twitter: '',
      };
      links.forEach((link) => {
        const key = link.label.toLowerCase();
        nextSocial[key] = link.url;
      });
      setSocial(nextSocial);
    } finally {
      setLoading(false);
    }
  };

  const loadInvites = async () => {
    if (!canInvite) return;
    setInvitesLoading(true);
    try {
      const data = await api.getWorkspaceInvites();
      setInvites(data);
    } catch (err) {
      console.error('Failed to load invites', err);
    } finally {
      setInvitesLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadInvites();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    try {
      const payload = {
        ...form,
        skills: form.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        interests: form.interests
          .split(',')
          .map((interest) => interest.trim())
          .filter(Boolean),
        social_links: socialFields
          .map(({ key }) => (social[key] ? { label: key, url: social[key] } : null))
          .filter((link): link is SocialLink => Boolean(link)),
      };
      const updated = await api.updateProfile(payload);
      setProfile(updated);
      await checkAuth();
      setToast('Profile updated successfully.');
    } catch (err) {
      console.error('Failed to update profile', err);
      setToast('Unable to save changes right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteForm.email.trim()) return;
    setInvitesLoading(true);
    setToast(null);
    try {
      await api.createWorkspaceInvite({
        email: inviteForm.email.trim(),
        role: inviteForm.role,
        message: inviteForm.message.trim() || undefined,
      });
      setInviteForm({ email: '', role: inviteForm.role, message: '' });
      await loadInvites();
      setToast('Invite sent successfully.');
    } catch (err: any) {
      console.error('Invite failed', err);
      setToast(err.response?.data?.detail || 'Unable to send invite.');
    } finally {
      setInvitesLoading(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    setInvitesLoading(true);
    try {
      await api.deleteWorkspaceInvite(inviteId);
      await loadInvites();
    } catch (err) {
      console.error('Failed to revoke invite', err);
    } finally {
      setInvitesLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="h-40 sm:h-56 w-full bg-cover bg-center" style={heroStyle} />
          <div className="px-6 sm:px-8 pb-6 -mt-16">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-28 h-28 rounded-3xl border-4 border-white shadow-lg overflow-hidden bg-white">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-3xl font-semibold">
                    {profile?.full_name?.charAt(0) || profile?.email.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-[200px]">
                <h1 className="text-2xl font-semibold text-gray-900">{form.full_name || profile?.email}</h1>
                <p className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                  {form.job_title && (
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> {form.job_title}
                    </span>
                  )}
                  {profile?.organization && (
                    <span className="inline-flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5" /> {profile.organization}
                    </span>
                  )}
                  {form.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {form.location}
                    </span>
                  )}
                </p>
                {form.bio && <p className="mt-2 text-sm text-gray-600 max-w-2xl">{form.bio}</p>}
              </div>
              <div className="flex flex-col gap-2">
                {form.skills && (
                  <div className="flex flex-wrap gap-2">
                    {form.skills
                      .split(',')
                      .map((skill) => skill.trim())
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {toast && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-800 px-4 py-2 text-sm">
            {toast}
          </div>
        )}

        <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Tell teammates how you prefer to collaborate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Full name</label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Job title</label>
                  <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Location</label>
                  <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Time zone</label>
                  <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Pronouns</label>
                  <Input value={form.pronouns} onChange={(e) => setForm({ ...form, pronouns: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Availability</label>
                  <Input value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Bio</label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Avatar URL</label>
                  <Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Banner URL</label>
                  <Input value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Primary contact email</label>
                  <Input
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Phone</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">Skills (comma separated)</label>
                  <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Interests (comma separated)</label>
                  <Input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {socialFields.map(({ key, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 uppercase">{placeholder}</label>
                    <Input value={social[key]} onChange={(e) => setSocial({ ...social, [key]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workspace invites</CardTitle>
                <CardDescription>Invite teammates by email to join {profile?.organization || 'your workspace'}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {canInvite ? (
                  <>
                    <Input
                      placeholder="Email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    />
                    <select
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <textarea
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                      rows={2}
                      placeholder="Message (optional)"
                      value={inviteForm.message}
                      onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                    />
                    <Button onClick={handleInvite} disabled={!inviteForm.email.trim() || invitesLoading}>
                      {invitesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" />Send invite</>}
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Only Program Managers or admins can send workspace invites.
                  </p>
                )}
                <div className="mt-4 space-y-3">
                  {invitesLoading && canInvite && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                  {!invitesLoading && invites.length === 0 && canInvite && (
                    <p className="text-sm text-gray-500">No pending invites.</p>
                  )}
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                        <p className="text-xs text-gray-500 capitalize">{invite.role.replace('_', ' ')} • {invite.status}</p>
                      </div>
                      {invite.status === 'pending' && canInvite && (
                        <Button variant="ghost" size="sm" onClick={() => handleRevokeInvite(invite.id)}>
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact & social</CardTitle>
                <CardDescription>Ways teammates can reach out.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                {form.contact_email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-indigo-500" /> {form.contact_email}
                  </p>
                )}
                {form.phone && (
                  <p className="flex items-center gap-2">
                    <span className="text-indigo-500 font-semibold">☎</span> {form.phone}
                  </p>
                )}
                {socialFields
                  .filter(({ key }) => social[key])
                  .map(({ key, placeholder }) => (
                    <a
                      key={key}
                      href={social[key]}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                    >
                      <LinkIcon className="h-4 w-4" />
                      {placeholder}
                    </a>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
