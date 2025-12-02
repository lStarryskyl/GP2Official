import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
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
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export const ProjectGovernancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Team management
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('program_manager');
  const [inviteNotes, setInviteNotes] = useState('');
  const [teamActionLoading, setTeamActionLoading] = useState(false);

  // Scenario branching
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

  const canManageTeam = (user?.role_authority || 0) >= MIN_TEAM_ADMIN_AUTHORITY;
  const teamMembers: ProjectTeamMember[] = project?.team_members || [];

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        setIsLoading(true);
        const projectData = await api.getProject(id);
        setProject(projectData);
        const branches = await api.getScenarioBranches(id);
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
    const updated = await api.getProject(id);
    setProject(updated);
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
    try {
      setCreatingBranch(true);
      const payload = {
        label: branchForm.label,
        description: branchForm.description,
        overrides: {
          provider: branchForm.provider,
          budget: branchForm.budget,
        },
        include_tasks: branchForm.includeTasks,
        include_requirements: branchForm.includeRequirements,
        include_artifacts: branchForm.includeArtifacts,
      };
      const branch = await api.createScenarioBranch(id, payload);
      setScenarioBranches((prev) => [branch, ...prev]);
      setBranchForm({
        label: '',
        description: '',
        provider: branchForm.provider,
        budget: '',
        includeTasks: true,
        includeRequirements: true,
        includeArtifacts: true,
      });
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
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-16 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Project not found</h2>
          <Button onClick={() => navigate('/projects')}>Back to projects</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate(`/projects/${project.project_id || project.id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to project
          </Button>
          <div className="text-sm text-gray-500">
            Updated {formatDateTime(project.updated_at)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-1 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Governance</p>
              <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-500">{project.template_type.replace('_', ' ')} • {project.owner_name || 'Unassigned'}</p>
            </div>
            <Button variant="outline" onClick={refreshProject}>
              Refresh data
            </Button>
          </div>
          {error && (
            <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team & Roles</CardTitle>
                  <CardDescription>Invite collaborators and manage authority.</CardDescription>
                </div>
                <Badge variant="secondary">{Math.max(teamMembers.length, 1)} members</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {canManageTeam ? (
                <div className="rounded-xl border-2 border-dashed border-amber-200 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <UserPlus className="h-4 w-4 text-amber-500" />
                    Invite teammate
                  </div>
                  <Input
                    placeholder="teammate@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <Input
                      placeholder="Notes (optional)"
                      value={inviteNotes}
                      onChange={(e) => setInviteNotes(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleInviteMember}
                    disabled={teamActionLoading || !inviteEmail.trim()}
                  >
                    {teamActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add to project'}
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 p-4 bg-gray-50 text-sm text-gray-600 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  You have read-only access to the roster. Contact a Program Manager to modify roles.
                </div>
              )}

              <div className="space-y-3">
                {teamMembers.length ? (
                  teamMembers.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{member.full_name || member.email}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-gray-500">{member.role_label}</p>
                        <p className="text-xs text-gray-400">Authority {member.authority}</p>
                      </div>
                      {canManageTeam && member.user_id !== project.owner_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.user_id)}
                          disabled={teamActionLoading}
                          className="text-red-500 hover:text-red-600"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No collaborators yet. Invite a teammate to get started.</p>
                )}
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                <p className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Authority ladder
                </p>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((role) => {
                    const assigned = teamMembers.some((member) => member.project_role === role.id);
                    return (
                      <div
                        key={role.id}
                        className={`p-3 rounded-xl border ${assigned ? 'border-indigo-300 bg-white' : 'border-transparent'}`}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900">{role.label}</span>
                          <span className="text-xs text-gray-500">Authority {role.authority}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scenario Branching</CardTitle>
              <CardDescription>Clone the plan with alternate budgets or providers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="border border-dashed border-indigo-200 rounded-xl p-4 space-y-3">
                  <Input
                    placeholder="Branch label (e.g., Gemini, Low budget)"
                    value={branchForm.label}
                    onChange={(e) => setBranchForm((prev) => ({ ...prev, label: e.target.value }))}
                  />
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Notes / assumptions"
                    value={branchForm.description}
                    onChange={(e) => setBranchForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">LLM Provider</label>
                      <select
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5"
                        value={branchForm.provider}
                        onChange={(e) => setBranchForm((prev) => ({ ...prev, provider: e.target.value }))}
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="azure">Azure OpenAI</option>
                        <option value="google">Gemini</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Budget guardrail</label>
                      <Input
                        placeholder="$50k"
                        value={branchForm.budget}
                        onChange={(e) => setBranchForm((prev) => ({ ...prev, budget: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {[
                      { key: 'includeRequirements', label: 'Requirements' },
                      { key: 'includeTasks', label: 'Tasks' },
                      { key: 'includeArtifacts', label: 'Artifacts' },
                    ].map(({ key, label }) => (
                      <label key={key} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(branchForm as any)[key]}
                          onChange={(e) => setBranchForm((prev) => ({ ...prev, [key]: e.target.checked }))}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <Button onClick={handleCreateBranch} disabled={creatingBranch || !branchForm.label.trim()}>
                    {creatingBranch ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create branch'}
                  </Button>
                </div>

                <div className="rounded-xl border border-gray-100 p-4 space-y-3 max-h-[320px] overflow-y-auto">
                  {scenarioBranches.length === 0 ? (
                    <p className="text-sm text-gray-500">No alternate branches yet. Clone this plan to compare options.</p>
                  ) : (
                    scenarioBranches.map((branch) => (
                      <div
                        key={branch.id}
                        className={`p-3 rounded-xl border ${selectedBranchId === branch.id ? 'border-indigo-400 bg-indigo-50/60' : 'border-gray-100 bg-white'} cursor-pointer`}
                        onClick={() => handleSelectBranch(branch.id)}
                      >
                        <p className="font-semibold text-gray-900">{branch.name}</p>
                        <p className="text-xs text-gray-500">{branch.scenario_label || 'Custom branch'}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {branch.phase_status ? Object.values(branch.phase_status).filter((status) => status === 'completed').length : 0} completed phases
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {branchDiff && (
                <div className="border border-indigo-100 rounded-xl p-4 space-y-4 bg-indigo-50/30">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Scenario comparison</p>
                      <p className="text-xs text-gray-500">Preview how the branch differs from the baseline plan.</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {branchDiffLoading ? 'Loading metrics…' : `Updated ${formatDateTime(new Date().toISOString())}`}
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    {(['baseline', 'branch'] as const).map((key) => {
                      const snapshot = branchDiff[key];
                      return (
                        <div key={key} className="rounded-xl border border-gray-100 p-3">
                          <p className="text-xs uppercase text-gray-500 mb-1">{key === 'baseline' ? 'Baseline' : 'Branch'}</p>
                          <p className="font-semibold text-gray-900">{snapshot.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{snapshot.status}</p>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-gray-500">Reqs</p>
                              <p className="font-semibold text-gray-900">{snapshot.requirements}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Tasks</p>
                              <p className="font-semibold text-gray-900">{snapshot.tasks}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Cost</p>
                              <p className="font-semibold text-gray-900">${snapshot.cost_estimate.toFixed(0)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    {Object.entries(branchDiff.summary).map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-gray-100 p-3 flex items-center justify-between">
                        <span className="capitalize text-gray-600">{key.replace('_', ' ')}</span>
                        <span className={`font-semibold ${value > 0 ? 'text-emerald-600' : value < 0 ? 'text-rose-600' : 'text-gray-900'}`}>
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
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectGovernancePage;
