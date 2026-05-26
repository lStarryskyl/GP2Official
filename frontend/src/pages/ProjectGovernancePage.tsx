import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import type { Project, ProjectTeamMember, ScenarioDiff } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { ROLE_OPTIONS, MIN_TEAM_ADMIN_AUTHORITY } from '@/constants/roles';
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Shield,
  UserPlus,
  UserMinus,
  Users,
  GitBranch,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  Circle,
  Sparkles,
  DollarSign,
  Cpu,
  Copy,
  BarChart3,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

const authorityColor = (a: number) => {
  if (a >= 5) return { bg: 'rgba(212,160,23,0.15)', text: '#D4A017', border: 'rgba(212,160,23,0.35)' };
  if (a >= 4) return { bg: 'rgba(26,111,212,0.15)', text: '#3d8fe0', border: 'rgba(26,111,212,0.35)' };
  if (a >= 3) return { bg: 'rgba(61,143,224,0.12)', text: '#70b3ee', border: 'rgba(61,143,224,0.25)' };
  if (a >= 2) return { bg: 'rgba(42,157,143,0.12)', text: '#2A9D8F', border: 'rgba(42,157,143,0.3)' };
  return { bg: 'rgba(74,96,112,0.15)', text: '#7aacc8', border: 'rgba(74,96,112,0.3)' };
};

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, badge, children }) => (
  <div
    style={{
      background: 'var(--brand-850)',
      border: '1px solid rgba(30,53,82,0.7)',
      borderRadius: '20px',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid rgba(30,53,82,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'rgba(26,111,212,0.12)',
            border: '1px solid rgba(26,111,212,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>
        </div>
      </div>
      {badge}
    </div>
    <div style={{ padding: '20px 24px' }}>{children}</div>
  </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
    {children}
  </p>
);

const DarkInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ style, ...props }) => (
  <input
    style={{
      width: '100%',
      background: 'var(--brand-800)',
      border: '1px solid rgba(30,53,82,0.8)',
      borderRadius: 10,
      padding: '9px 12px',
      fontSize: 13,
      color: 'var(--text-primary)',
      outline: 'none',
      boxSizing: 'border-box',
      ...style,
    }}
    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(26,111,212,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,111,212,0.12)'; }}
    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(30,53,82,0.8)'; e.currentTarget.style.boxShadow = 'none'; }}
    {...props}
  />
);

const DarkTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ style, ...props }) => (
  <textarea
    style={{
      width: '100%',
      background: 'var(--brand-800)',
      border: '1px solid rgba(30,53,82,0.8)',
      borderRadius: 10,
      padding: '9px 12px',
      fontSize: 13,
      color: 'var(--text-primary)',
      outline: 'none',
      resize: 'vertical',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      ...style,
    }}
    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(26,111,212,0.6)'; }}
    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(30,53,82,0.8)'; }}
    {...props}
  />
);

const DarkSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ style, children, ...props }) => (
  <select
    style={{
      width: '100%',
      background: 'var(--brand-800)',
      border: '1px solid rgba(30,53,82,0.8)',
      borderRadius: 10,
      padding: '9px 12px',
      fontSize: 13,
      color: 'var(--text-primary)',
      outline: 'none',
      cursor: 'pointer',
      boxSizing: 'border-box',
      ...style,
    }}
    {...props}
  >
    {children}
  </select>
);

export const ProjectGovernancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('program_manager');
  const [inviteNotes, setInviteNotes] = useState('');
  const [teamActionLoading, setTeamActionLoading] = useState(false);

  const [scenarioBranches, setScenarioBranches] = useState<Project[]>([]);
  const [branchForm, setBranchForm] = useState({
    label: '',
    description: '',
    provider: 'openai',
    budget: '',
    includeTasks: true,
    includeRequirements: true,
    includeArtifacts: true,
  });
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [branchDiff, setBranchDiff] = useState<ScenarioDiff | null>(null);
  const [branchDiffLoading, setBranchDiffLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const canManageTeam = (user?.role_authority || 0) >= MIN_TEAM_ADMIN_AUTHORITY;
  const teamMembers: ProjectTeamMember[] = project?.team_members || [];

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [projectData, branches] = await Promise.all([
          api.getProject(id),
          api.getScenarioBranches(id),
        ]);
        setProject(projectData);
        setScenarioBranches(branches);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Unable to load governance data.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const refreshProject = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const updated = await api.getProject(id);
      setProject(updated);
    } finally {
      setRefreshing(false);
    }
  };

  const handleInviteMember = async () => {
    if (!id || !inviteEmail.trim()) return;
    setTeamActionLoading(true);
    setError(null);
    try {
      const updated = await api.addTeamMember(id, {
        email: inviteEmail.trim(),
        project_role: inviteRole,
        notes: inviteNotes.trim() || undefined,
      });
      setProject(updated);
      setInviteEmail('');
      setInviteNotes('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to invite teammate.');
    } finally {
      setTeamActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id) return;
    setTeamActionLoading(true);
    setError(null);
    try {
      const updated = await api.removeTeamMember(id, memberId);
      setProject(updated);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to remove member.');
    } finally {
      setTeamActionLoading(false);
    }
  };

  const loadBranchDiff = async (branchId: string) => {
    if (!id) return;
    setBranchDiffLoading(true);
    try {
      const diff = await api.getScenarioBranchDiff(id, branchId);
      setBranchDiff(diff);
    } catch (err) {
      console.error('Failed to load branch comparison', err);
    } finally {
      setBranchDiffLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!id || !branchForm.label.trim()) return;
    setCreatingBranch(true);
    try {
      const payload = {
        label: branchForm.label,
        description: branchForm.description,
        overrides: { provider: branchForm.provider, budget: branchForm.budget },
        include_tasks: branchForm.includeTasks,
        include_requirements: branchForm.includeRequirements,
        include_artifacts: branchForm.includeArtifacts,
      };
      const branch = await api.createScenarioBranch(id, payload);
      setScenarioBranches(prev => [branch, ...prev]);
      setBranchForm({ ...branchForm, label: '', description: '', budget: '' });
    } catch (err) {
      console.error('Failed to create scenario branch', err);
    } finally {
      setCreatingBranch(false);
    }
  };

  const handleSelectBranch = (branchId?: string) => {
    if (!branchId) return;
    setSelectedBranchId(branchId);
    loadBranchDiff(branchId);
  };

  if (isLoading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
          <Loader2 style={{ width: 32, height: 32, color: 'var(--blue-400)', animation: 'spin 1s linear infinite' }} />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Project not found.</p>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </Layout>
    );
  }

  const projectId = project.project_id || project.id;

  return (
    <Layout>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Top bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
              padding: '6px 10px', borderRadius: 8,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <ArrowLeft size={15} />
            Back to project
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            Updated {formatDateTime(project.updated_at)}
          </span>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, var(--brand-800) 0%, var(--brand-850) 100%)',
            border: '1px solid rgba(26,111,212,0.2)',
            borderRadius: 20,
            padding: '28px 32px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(26,111,212,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  background: 'rgba(26,111,212,0.15)',
                  border: '1px solid rgba(26,111,212,0.3)',
                  borderRadius: 6, padding: '3px 10px',
                  fontSize: 10, fontWeight: 700, color: '#3d8fe0',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  Governance
                </div>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                {project.name}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                {project.template_type.replace('_', ' ')}
                <span style={{ margin: '0 6px', opacity: 0.4 }}>•</span>
                {project.owner_name || 'Unassigned'}
              </p>
            </div>
            <button
              onClick={refreshProject}
              disabled={refreshing}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--brand-700)', border: '1px solid rgba(30,53,82,0.8)',
                borderRadius: 10, padding: '8px 16px',
                fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                opacity: refreshing ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              Refresh data
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 8,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 13, color: '#f87171',
            }}>
              <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 24 }}>

          <SectionCard
            icon={<Users size={18} color="#3d8fe0" />}
            title="Team & Roles"
            subtitle="Invite collaborators and manage authority."
            badge={
              <div style={{
                background: 'rgba(26,111,212,0.12)',
                border: '1px solid rgba(26,111,212,0.3)',
                borderRadius: 20, padding: '3px 12px',
                fontSize: 12, fontWeight: 600, color: '#3d8fe0',
              }}>
                {Math.max(teamMembers.length, 1)} member{Math.max(teamMembers.length, 1) !== 1 ? 's' : ''}
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {canManageTeam ? (
                <div style={{
                  background: 'var(--brand-800)',
                  border: '1px dashed rgba(26,111,212,0.35)',
                  borderRadius: 14, padding: 16,
                  display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserPlus size={15} color="#3d8fe0" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Invite teammate
                    </span>
                  </div>
                  <DarkInput
                    placeholder="teammate@example.com"
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <DarkSelect value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                      {ROLE_OPTIONS.map(role => (
                        <option key={role.id} value={role.id}>{role.label}</option>
                      ))}
                    </DarkSelect>
                    <DarkInput
                      placeholder="Notes (optional)"
                      value={inviteNotes}
                      onChange={e => setInviteNotes(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleInviteMember}
                    disabled={teamActionLoading || !inviteEmail.trim()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: teamActionLoading || !inviteEmail.trim()
                        ? 'rgba(26,111,212,0.2)'
                        : 'linear-gradient(135deg, #1A6FD4, #0d2b52)',
                      border: '1px solid rgba(26,111,212,0.4)',
                      borderRadius: 10, padding: '9px 20px',
                      fontSize: 13, fontWeight: 600, color: '#fff',
                      cursor: teamActionLoading || !inviteEmail.trim() ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      alignSelf: 'flex-start',
                    }}
                  >
                    {teamActionLoading
                      ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      : <><UserPlus size={14} />Add to project</>}
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: 'rgba(74,96,112,0.1)', border: '1px solid rgba(74,96,112,0.25)',
                  borderRadius: 12, padding: '12px 14px',
                  fontSize: 13, color: 'var(--text-muted)',
                }}>
                  <Shield size={14} style={{ marginTop: 1, flexShrink: 0, color: '#7aacc8' }} />
                  You have read-only access. Contact a Program Manager to modify roles.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {teamMembers.length > 0 ? (
                  teamMembers.map(member => {
                    const ac = authorityColor(member.authority);
                    return (
                      <div
                        key={member.user_id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                          background: 'var(--brand-800)', border: '1px solid rgba(30,53,82,0.6)',
                          borderRadius: 12, padding: '12px 14px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--brand-600), var(--blue-700))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
                            flexShrink: 0,
                          }}>
                            {(member.full_name || member.email)[0].toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {member.full_name || member.email}
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                              {member.email}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <div style={{
                            background: ac.bg, border: `1px solid ${ac.border}`,
                            borderRadius: 20, padding: '3px 10px',
                            fontSize: 11, fontWeight: 600, color: ac.text,
                            whiteSpace: 'nowrap',
                          }}>
                            {member.role_label} · {member.authority}
                          </div>
                          {canManageTeam && member.user_id !== project.owner_id && (
                            <button
                              onClick={() => handleRemoveMember(member.user_id)}
                              disabled={teamActionLoading}
                              style={{
                                width: 28, height: 28, borderRadius: 7,
                                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', transition: 'all 0.2s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                            >
                              <UserMinus size={13} color="#f87171" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                    No collaborators yet. Invite a teammate to get started.
                  </p>
                )}
              </div>

              <div style={{
                background: 'rgba(26,111,212,0.06)',
                border: '1px solid rgba(26,111,212,0.18)',
                borderRadius: 14, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Shield size={14} color="#3d8fe0" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#3d8fe0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Authority ladder
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ROLE_OPTIONS.map(role => {
                    const assigned = teamMembers.some(m => m.project_role === role.id);
                    const ac = authorityColor(role.authority);
                    return (
                      <div
                        key={role.id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                          background: assigned ? 'rgba(26,111,212,0.08)' : 'transparent',
                          border: `1px solid ${assigned ? 'rgba(26,111,212,0.25)' : 'transparent'}`,
                          borderRadius: 10, padding: '8px 12px',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {assigned
                            ? <CheckCircle2 size={13} color="#3d8fe0" />
                            : <Circle size={13} color="var(--text-faint)" />}
                          <div>
                            <p style={{ fontSize: 13, fontWeight: assigned ? 600 : 500, color: assigned ? 'var(--text-primary)' : 'var(--text-muted)', margin: 0 }}>
                              {role.label}
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: 0 }}>{role.description}</p>
                          </div>
                        </div>
                        <div style={{
                          background: ac.bg, border: `1px solid ${ac.border}`,
                          borderRadius: 20, padding: '2px 8px',
                          fontSize: 11, fontWeight: 600, color: ac.text, flexShrink: 0,
                        }}>
                          {role.authority}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={<GitBranch size={18} color="#3d8fe0" />}
            title="Scenario Branching"
            subtitle="Clone the plan with alternate budgets or providers."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <div style={{
                background: 'var(--brand-800)',
                border: '1px dashed rgba(26,111,212,0.3)',
                borderRadius: 14, padding: 16,
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <Sparkles size={14} color="#3d8fe0" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>New branch</span>
                </div>
                <DarkInput
                  placeholder="Branch label (e.g., Gemini, Low budget)"
                  value={branchForm.label}
                  onChange={e => setBranchForm(prev => ({ ...prev, label: e.target.value }))}
                />
                <DarkTextarea
                  rows={2}
                  placeholder="Notes / assumptions"
                  value={branchForm.description}
                  onChange={e => setBranchForm(prev => ({ ...prev, description: e.target.value }))}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <FieldLabel><Cpu size={10} style={{ display: 'inline', marginRight: 4 }} />LLM Provider</FieldLabel>
                    <DarkSelect
                      value={branchForm.provider}
                      onChange={e => setBranchForm(prev => ({ ...prev, provider: e.target.value }))}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="azure">Azure OpenAI</option>
                      <option value="google">Gemini</option>
                    </DarkSelect>
                  </div>
                  <div>
                    <FieldLabel><DollarSign size={10} style={{ display: 'inline', marginRight: 4 }} />Budget guardrail</FieldLabel>
                    <DarkInput
                      placeholder="$50k"
                      value={branchForm.budget}
                      onChange={e => setBranchForm(prev => ({ ...prev, budget: e.target.value }))}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { key: 'includeRequirements', label: 'Requirements' },
                    { key: 'includeTasks', label: 'Tasks' },
                    { key: 'includeArtifacts', label: 'Artifacts' },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={(branchForm as any)[key]}
                        onChange={e => setBranchForm(prev => ({ ...prev, [key]: e.target.checked }))}
                        style={{ accentColor: '#1A6FD4' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleCreateBranch}
                  disabled={creatingBranch || !branchForm.label.trim()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: creatingBranch || !branchForm.label.trim()
                      ? 'rgba(26,111,212,0.2)'
                      : 'linear-gradient(135deg, #1A6FD4, #0d2b52)',
                    border: '1px solid rgba(26,111,212,0.4)',
                    borderRadius: 10, padding: '9px 20px',
                    fontSize: 13, fontWeight: 600, color: '#fff',
                    cursor: creatingBranch || !branchForm.label.trim() ? 'not-allowed' : 'pointer',
                    alignSelf: 'flex-start',
                    transition: 'all 0.2s',
                  }}
                >
                  {creatingBranch
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Creating…</>
                    : <><GitBranch size={14} />Create branch</>}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scenarioBranches.length === 0 ? (
                  <div style={{
                    background: 'var(--brand-800)', border: '1px solid rgba(30,53,82,0.5)',
                    borderRadius: 12, padding: '20px 16px', textAlign: 'center',
                  }}>
                    <Copy size={22} color="var(--text-faint)" style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                      No alternate branches yet. Clone this plan to compare options.
                    </p>
                  </div>
                ) : (
                  scenarioBranches.map(branch => {
                    const isSelected = selectedBranchId === branch.id;
                    const completed = branch.phase_status
                      ? Object.values(branch.phase_status).filter(s => s === 'completed').length
                      : 0;
                    return (
                      <div
                        key={branch.id}
                        onClick={() => handleSelectBranch(branch.id)}
                        style={{
                          background: isSelected ? 'rgba(26,111,212,0.1)' : 'var(--brand-800)',
                          border: `1px solid ${isSelected ? 'rgba(26,111,212,0.4)' : 'rgba(30,53,82,0.6)'}`,
                          borderRadius: 12, padding: '12px 14px',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                          transition: 'all 0.2s',
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                            {branch.name}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                            {branch.scenario_label || 'Custom branch'} · {completed} phases completed
                          </p>
                        </div>
                        <ChevronRight size={14} color={isSelected ? '#3d8fe0' : 'var(--text-faint)'} />
                      </div>
                    );
                  })
                )}
              </div>

              {branchDiff && (
                <div style={{
                  background: 'rgba(26,111,212,0.05)',
                  border: '1px solid rgba(26,111,212,0.2)',
                  borderRadius: 14, padding: 16,
                  display: 'flex', flexDirection: 'column', gap: 14,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <BarChart3 size={14} color="#3d8fe0" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Scenario comparison
                    </span>
                    {branchDiffLoading && (
                      <Loader2 size={12} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite', marginLeft: 'auto' }} />
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {(['baseline', 'branch'] as const).map(key => {
                      const snap = branchDiff[key];
                      return (
                        <div key={key} style={{
                          background: 'var(--brand-800)', border: '1px solid rgba(30,53,82,0.6)',
                          borderRadius: 12, padding: '12px 14px',
                        }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>
                            {key === 'baseline' ? 'Baseline' : 'Branch'}
                          </p>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                            {snap.name}
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                            {[
                              { label: 'Reqs', value: snap.requirements },
                              { label: 'Tasks', value: snap.tasks },
                              { label: 'Cost', value: `$${snap.cost_estimate.toFixed(0)}` },
                            ].map(({ label, value }) => (
                              <div key={label}>
                                <p style={{ fontSize: 10, color: 'var(--text-faint)', margin: '0 0 1px' }}>{label}</p>
                                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
<<<<<<< HEAD
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    {Object.entries(branchDiff.summary).map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-gray-100 p-3 flex items-center justify-between">
                        <span className="capitalize text-gray-600">{key.replace('_', ' ')}</span>
                        <span className={`font-semibold ${value > 0 ? 'text-blue-400' : value < 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                  {branchDiff.phase_deltas.length > 0 && (
                    <div className="space-y-2 text-xs text-gray-600">
                      <p className="font-medium text-gray-900">Phase deltas</p>
                      {branchDiff.phase_deltas.map((delta) => (
                        <div key={delta.phase} className="flex items-center justify-between">
                          <span className="capitalize">{delta.phase.replace('_', ' ')}</span>
                          <span>
                            {delta.baseline} → <span className="text-indigo-600">{delta.branch}</span>
=======

                  {Object.entries(branchDiff.summary).length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {Object.entries(branchDiff.summary).map(([key, value]) => (
                        <div key={key} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: 'var(--brand-800)', border: '1px solid rgba(30,53,82,0.5)',
                          borderRadius: 10, padding: '8px 12px',
                        }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {key.replace('_', ' ')}
                          </span>
                          <span style={{
                            fontSize: 13, fontWeight: 700,
                            color: value > 0 ? '#3d8fe0' : value < 0 ? '#f87171' : 'var(--text-muted)',
                          }}>
                            {value > 0 ? '+' : ''}{value}
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {branchDiff.phase_deltas.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                        Phase deltas
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {branchDiff.phase_deltas.map(delta => (
                          <div key={delta.phase} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            fontSize: 12, color: 'var(--text-muted)',
                          }}>
                            <span style={{ textTransform: 'capitalize' }}>{delta.phase.replace('_', ' ')}</span>
                            <span>
                              {delta.baseline}
                              <span style={{ margin: '0 6px', color: 'var(--text-faint)' }}>→</span>
                              <span style={{ color: '#3d8fe0', fontWeight: 600 }}>{delta.branch}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </SectionCard>

        </div>
      </div>
    </Layout>
  );
};

export default ProjectGovernancePage;