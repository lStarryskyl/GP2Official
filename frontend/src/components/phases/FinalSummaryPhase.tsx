import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Flag,
  ExternalLink,
  Printer,
  Mail,
  Share2,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import { phaseConfigs } from '@/constants/phases';
import { api } from '@/lib/api';
import type { Project } from '@/types';

interface SummaryEdits {
  keyDecisions?: string[];
  customNextSteps?: { text: string; owner: string }[];
}

interface FinalSummaryPhaseProps {
  projectId: string;
  projectName: string;
  phaseStatus: Record<string, string>;
  stats: {
    requirements: number;
    tasks: number;
    artifacts: number;
    progress: number;
  };
}

export const FinalSummaryPhase: React.FC<FinalSummaryPhaseProps> = ({
  projectId,
  projectName,
  phaseStatus,
  stats,
}) => {
  const navigate = useNavigate();

  const [keyDecisions, setKeyDecisions] = useState<string[]>([]);
  const [customNextSteps, setCustomNextSteps] = useState<{ text: string; owner: string }[]>([]);
  const [editingDecisions, setEditingDecisions] = useState(false);
  const [editingNextSteps, setEditingNextSteps] = useState(false);
  const [decisionsDraft, setDecisionsDraft] = useState<string[]>([]);
  const [nextStepsDraft, setNextStepsDraft] = useState<{ text: string; owner: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const project: Project = await api.getProject(projectId);
        const edits = (project.ui_preferences?.summaryEdits ?? {}) as SummaryEdits;
        if (Array.isArray(edits.keyDecisions)) setKeyDecisions(edits.keyDecisions);
        if (Array.isArray(edits.customNextSteps)) setCustomNextSteps(edits.customNextSteps);
      } catch (err) {
        console.error('Failed to load project summary edits', err);
      }
    };
    load();
  }, [projectId]);

  const saveDecisions = async (decisions: string[]) => {
    setSaving(true);
    try {
      const project: Project = await api.getProject(projectId);
      const existingEdits = (project.ui_preferences?.summaryEdits ?? {}) as SummaryEdits;
      const updatedPrefs = {
        ...(project.ui_preferences ?? {}),
        summaryEdits: { ...existingEdits, keyDecisions: decisions },
      };
      await api.updateProject(projectId, { ui_preferences: updatedPrefs });
      setKeyDecisions(decisions);
    } catch (err) {
      console.error('Failed to save key decisions', err);
    } finally {
      setSaving(false);
    }
  };

  const saveCustomNextSteps = async (steps: { text: string; owner: string }[]) => {
    setSaving(true);
    try {
      const project: Project = await api.getProject(projectId);
      const existingEdits = (project.ui_preferences?.summaryEdits ?? {}) as SummaryEdits;
      const updatedPrefs = {
        ...(project.ui_preferences ?? {}),
        summaryEdits: { ...existingEdits, customNextSteps: steps },
      };
      await api.updateProject(projectId, { ui_preferences: updatedPrefs });
      setCustomNextSteps(steps);
    } catch (err) {
      console.error('Failed to save next steps', err);
    } finally {
      setSaving(false);
    }
  };

  const startEditDecisions = () => {
    setDecisionsDraft(keyDecisions.length ? [...keyDecisions] : ['']);
    setEditingDecisions(true);
  };

  const startEditNextSteps = () => {
    setNextStepsDraft(customNextSteps.length ? [...customNextSteps] : [{ text: '', owner: '' }]);
    setEditingNextSteps(true);
  };

  const commitDecisions = async () => {
    const cleaned = decisionsDraft.map(d => d.trim()).filter(Boolean);
    await saveDecisions(cleaned);
    setEditingDecisions(false);
  };

  const commitNextSteps = async () => {
    const cleaned = nextStepsDraft.filter(s => s.text.trim());
    await saveCustomNextSteps(cleaned);
    setEditingNextSteps(false);
  };

  const getPhaseIcon = (id: string): React.ReactNode => {
    switch (id) {
      case 'planning': return <Calendar className="h-4 w-4" />;
      case 'feasibility_study': return <BarChart3 className="h-4 w-4" />;
      case 'requirements_gathering': return <FileText className="h-4 w-4" />;
      case 'validation': return <CheckCircle2 className="h-4 w-4" />;
      case 'design': return <Flag className="h-4 w-4" />;
      case 'development': return <FileText className="h-4 w-4" />;
      case 'tasks': return <Users className="h-4 w-4" />;
      case 'summary': return <TrendingUp className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  const autoNextSteps = phaseConfigs
    .filter((p) => phaseStatus[p.id] !== 'completed')
    .slice(0, 4)
    .map((p) => ({ step: `Complete: ${p.title}`, owner: 'Project Team', dueDate: 'Upcoming' }));

  const handlePrint = () => window.print();

  const handleShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      prompt('Copy this link:', window.location.href);
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Project Summary: ${projectName}`);
    const body = encodeURIComponent(`View the full project summary at: ${window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const completedPhases = Object.values(phaseStatus).filter(s => s === 'completed').length;
  const overallProgress = Math.round((completedPhases / phaseConfigs.length) * 100);

  return (
    <div className="space-y-6">
      {/* Project Overview Card */}
      <Card className="overflow-hidden" style={{ border: '1px solid rgba(26,111,212,0.25)' }}>
        <div className="p-8" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0f2540 60%, #1a3a5c 100%)', borderBottom: '1px solid rgba(26,111,212,0.2)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{projectName}</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Project Summary & Final Review</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold" style={{ color: '#1A6FD4' }}>{overallProgress}%</div>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Overall Progress</p>
            </div>
          </div>
        </div>
        <CardContent className="p-6" style={{ background: 'var(--brand-800)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl text-center" style={{ background: 'var(--brand-750, #152238)', border: '1px solid rgba(26,111,212,0.2)' }}>
              <div className="text-2xl font-bold" style={{ color: '#60a5fa' }}>{stats.requirements}</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Requirements</div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: 'var(--brand-750, #152238)', border: '1px solid rgba(26,111,212,0.2)' }}>
              <div className="text-2xl font-bold" style={{ color: '#60a5fa' }}>{stats.tasks}</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Tasks</div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: 'var(--brand-750, #152238)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <div className="text-2xl font-bold" style={{ color: '#fb923c' }}>{stats.artifacts}</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Artifacts</div>
            </div>
            <div className="p-4 rounded-xl text-center" style={{ background: 'var(--brand-750, #152238)', border: '1px solid rgba(26,111,212,0.2)' }}>
              <div className="text-2xl font-bold" style={{ color: '#4ade80' }}>{completedPhases}/{phaseConfigs.length}</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Phases Done</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <BarChart3 className="h-5 w-5" style={{ color: '#1A6FD4' }} />
            Phase Completion Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {phaseConfigs.map((phase) => {
              const status = phaseStatus[phase.id] || 'locked';
              const isComplete = status === 'completed';
              const isInProgress = status === 'in_progress';
              return (
                <div
                  key={phase.id}
                  className="flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer hover:brightness-110"
                  style={{
                    border: isComplete ? '2px solid rgba(26,111,212,0.4)' : isInProgress ? '2px solid rgba(249,115,22,0.4)' : '2px solid var(--brand-700)',
                    background: isComplete ? 'rgba(26,111,212,0.08)' : isInProgress ? 'rgba(249,115,22,0.06)' : 'var(--brand-750, #152238)',
                  }}
                  onClick={() => navigate(`/projects/${projectId}/phases/${phase.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: 'var(--brand-700)' }}>
                      {getPhaseIcon(phase.id)}
                    </span>
                    <div>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{phase.title}</div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{phase.description.slice(0, 60)}...</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={isComplete ? 'success' : isInProgress ? 'warning' : 'secondary'}>
                      {status.replace('_', ' ')}
                    </Badge>
                    {isComplete && <CheckCircle2 className="h-5 w-5 text-blue-400" />}
                    <ArrowRight className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Decisions — inline editable */}
      <Card style={{ background: 'var(--brand-800)', border: '1px solid rgba(26,111,212,0.2)' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Flag className="h-5 w-5" style={{ color: '#1A6FD4' }} />
              Key Decisions
            </CardTitle>
            {!editingDecisions ? (
              <Button size="sm" variant="outline" onClick={startEditDecisions} className="text-xs">
                <Edit3 className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={commitDecisions} disabled={saving} className="text-xs bg-blue-600 text-white hover:bg-blue-700">
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingDecisions(false)} className="text-xs">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingDecisions ? (
            <div className="space-y-2">
              {decisionsDraft.map((decision, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 rounded-lg text-sm bg-[#152238] border border-[var(--brand-700)] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="Enter a key decision..."
                    value={decision}
                    onChange={(e) => {
                      const next = [...decisionsDraft];
                      next[idx] = e.target.value;
                      setDecisionsDraft(next);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDecisionsDraft(decisionsDraft.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDecisionsDraft([...decisionsDraft, ''])}
                className="text-xs mt-2"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Decision
              </Button>
            </div>
          ) : keyDecisions.length > 0 ? (
            <div className="space-y-2">
              {keyDecisions.map((decision, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--brand-750, #152238)', border: '1px solid rgba(26,111,212,0.2)' }}>
                  <Flag className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#60a5fa' }} />
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{decision}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--brand-750, #152238)', border: '1px dashed rgba(26,111,212,0.3)' }}>
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#60a5fa' }} />
              <p style={{ color: 'var(--text-muted)' }}>
                No key decisions recorded yet. Click <strong style={{ color: 'var(--blue-400)' }}>Edit</strong> to add your own decisions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps — inline editable + auto-generated */}
      <Card style={{ background: 'var(--brand-800)', border: '1px solid rgba(26,111,212,0.2)' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <ArrowRight className="h-5 w-5" style={{ color: '#1A6FD4' }} />
              Next Steps
            </CardTitle>
            {!editingNextSteps ? (
              <Button size="sm" variant="outline" onClick={startEditNextSteps} className="text-xs">
                <Edit3 className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={commitNextSteps} disabled={saving} className="text-xs bg-blue-600 text-white hover:bg-blue-700">
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingNextSteps(false)} className="text-xs">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingNextSteps ? (
            <div className="space-y-2">
              {nextStepsDraft.map((step, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 rounded-lg text-sm bg-[#152238] border border-[var(--brand-700)] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="Next step description..."
                    value={step.text}
                    onChange={(e) => {
                      const next = [...nextStepsDraft];
                      next[idx] = { ...next[idx], text: e.target.value };
                      setNextStepsDraft(next);
                    }}
                  />
                  <input
                    className="w-32 px-3 py-2 rounded-lg text-sm bg-[#152238] border border-[var(--brand-700)] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    placeholder="Owner"
                    value={step.owner}
                    onChange={(e) => {
                      const next = [...nextStepsDraft];
                      next[idx] = { ...next[idx], owner: e.target.value };
                      setNextStepsDraft(next);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setNextStepsDraft(nextStepsDraft.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNextStepsDraft([...nextStepsDraft, { text: '', owner: '' }])}
                className="text-xs mt-2"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Step
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {customNextSteps.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Custom Steps</p>
                  {customNextSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--brand-750, #152238)', border: '1px solid rgba(26,111,212,0.2)' }}>
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{step.text}</div>
                        {step.owner && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{step.owner}</div>}
                      </div>
                    </div>
                  ))}
                </>
              )}
              {autoNextSteps.length > 0 && (
                <>
                  {customNextSteps.length > 0 && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-3 mb-1">Pending Phases</p>}
                  {autoNextSteps.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--brand-750, #152238)', border: '1px solid var(--brand-700)' }}>
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{item.step}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.owner}</div>
                      </div>
                      <Badge variant="secondary">{item.dueDate}</Badge>
                    </div>
                  ))}
                </>
              )}
              {customNextSteps.length === 0 && autoNextSteps.length === 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--brand-750, #152238)', border: '1px dashed rgba(26,111,212,0.3)' }}>
                  <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: '#60a5fa' }} />
                  <p style={{ color: 'var(--text-muted)' }}>
                    All phases complete! Click <strong style={{ color: 'var(--blue-400)' }}>Edit</strong> to add any remaining next steps.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export & Share */}
      <Card style={{ background: 'var(--brand-800)', border: '1px solid rgba(26,111,212,0.2)' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FileText className="h-5 w-5" style={{ color: '#1A6FD4' }} />
            Export & Share
          </CardTitle>
          <CardDescription style={{ color: 'var(--text-muted)' }}>Download or share the project summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handlePrint}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print Summary
            </Button>
            <Button variant="outline" onClick={handleEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Email Report
            </Button>
            <Button variant="outline" onClick={handleShareLink}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card style={{ background: 'linear-gradient(135deg, #0D1B2A, #0f2a4a)', border: '1px solid rgba(26,111,212,0.3)' }}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div style={{ color: 'var(--text-primary)' }}>
              <h3 className="text-xl font-bold mb-1">Wrap up or start a new iteration</h3>
              <p style={{ color: 'var(--text-muted)' }}>Jump back to overview or revisit earlier phases</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/projects/${projectId}`)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Project Overview
              </Button>
              <Button
                style={{ background: '#1A6FD4', color: '#fff', border: 'none' }}
                onClick={() => navigate(`/projects/${projectId}/phases/${phaseConfigs[0].id}`)}
              >
                Start New Iteration
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinalSummaryPhase;
