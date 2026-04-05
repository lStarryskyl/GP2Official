import React from 'react';
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
} from 'lucide-react';
import { phaseConfigs } from '@/constants/phases';

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

  const getPhaseIcon = (id: string): React.ReactNode => {
    switch (id) {
      case 'planning':
        return <Calendar className="h-4 w-4" />;
      case 'feasibility_study':
        return <BarChart3 className="h-4 w-4" />;
      case 'requirements_gathering':
        return <FileText className="h-4 w-4" />;
      case 'validation':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'design':
        return <Flag className="h-4 w-4" />;
      case 'development':
        return <FileText className="h-4 w-4" />;
      case 'tasks':
        return <Users className="h-4 w-4" />;
      case 'summary':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  };

  const keyDecisions = [
    { decision: 'Tech Stack: React + FastAPI + MongoDB', impact: 'High', date: 'Week 2' },
    { decision: 'Single backend service with clear phase workflow', impact: 'High', date: 'Week 3' },
    { decision: 'Optional LLM integration (Gemini / HuggingFace / stub)', impact: 'Medium', date: 'Week 4' },
    { decision: 'Container-ready deployment with ASGI (uvicorn)', impact: 'High', date: 'Week 5' },
    { decision: 'Iterative delivery across 8 planning phases', impact: 'Medium', date: 'Week 1' },
  ];

  const risks = [
    { risk: 'Third-party API rate limits may affect performance', severity: 'Medium', mitigation: 'Implement caching and rate limit handling' },
    { risk: 'Team capacity constraints during Q4', severity: 'High', mitigation: 'Prioritize critical features, consider contractors' },
    { risk: 'Data migration complexity from legacy system', severity: 'Medium', mitigation: 'Phased migration approach' },
    { risk: 'Security compliance requirements (GDPR)', severity: 'High', mitigation: 'Early legal review, privacy by design' },
  ];

  const nextSteps = [
    { step: 'Finalize development environment setup', owner: 'DevOps Team', dueDate: 'This week' },
    { step: 'Begin Sprint 1 with core authentication module', owner: 'Backend Team', dueDate: 'Next week' },
    { step: 'Set up CI/CD pipeline', owner: 'DevOps Team', dueDate: 'This week' },
    { step: 'Schedule stakeholder review for MVP demo', owner: 'PM', dueDate: 'Month 2' },
  ];

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
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print Summary
            </Button>
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Email Report
            </Button>
            <Button variant="outline">
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
