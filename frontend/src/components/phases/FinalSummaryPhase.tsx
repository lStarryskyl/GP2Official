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
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-stone-600 to-neutral-700 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{projectName}</h1>
              <p className="text-white/80">Project Summary & Final Review</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-white">{overallProgress}%</div>
              <p className="text-white/80">Overall Progress</p>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.requirements}</div>
              <div className="text-sm text-blue-600">Requirements</div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl text-center">
              <div className="text-2xl font-bold text-emerald-700">{stats.tasks}</div>
              <div className="text-sm text-emerald-600">Tasks</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl text-center">
              <div className="text-2xl font-bold text-purple-700">{stats.artifacts}</div>
              <div className="text-sm text-purple-600">Artifacts</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl text-center">
              <div className="text-2xl font-bold text-amber-700">{completedPhases}/{phaseConfigs.length}</div>
              <div className="text-sm text-amber-600">Phases Done</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-600" />
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
                  className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                    isComplete
                      ? 'border-emerald-200 bg-emerald-50'
                      : isInProgress
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  onClick={() => navigate(`/projects/${projectId}/phases/${phase.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                      {getPhaseIcon(phase.id)}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900">{phase.title}</div>
                      <div className="text-sm text-gray-500">{phase.description.slice(0, 60)}...</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={isComplete ? 'success' : isInProgress ? 'warning' : 'secondary'}>
                      {status.replace('_', ' ')}
                    </Badge>
                    {isComplete && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Decisions */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-blue-600" />
            Key Decisions Made
          </CardTitle>
          <CardDescription>Important architectural and strategic decisions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Decision</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Impact</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {keyDecisions.map((item, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{item.decision}</td>
                  <td className="px-4 py-3">
                    <Badge variant={item.impact === 'High' ? 'destructive' : 'warning'}>{item.impact}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Risks & Mitigations */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Risks & Mitigations
          </CardTitle>
          <CardDescription>Identified risks and their mitigation strategies</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {risks.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border-l-4 ${
                item.severity === 'High'
                  ? 'border-l-red-500 bg-red-50'
                  : 'border-l-amber-500 bg-amber-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-gray-900">{item.risk}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    <strong>Mitigation:</strong> {item.mitigation}
                  </div>
                </div>
                <Badge variant={item.severity === 'High' ? 'destructive' : 'warning'}>
                  {item.severity}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Next Steps
          </CardTitle>
          <CardDescription>Immediate action items to move forward</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {nextSteps.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-200 hover:border-emerald-300 transition-colors">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.step}</div>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <Users className="h-3 w-3" /> {item.owner}
                  <span className="mx-1">•</span>
                  <Calendar className="h-3 w-3" /> {item.dueDate}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Export & Share */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            Export & Share
          </CardTitle>
          <CardDescription>Download or share the project summary</CardDescription>
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
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h3 className="text-xl font-bold mb-1">Wrap up or start a new iteration</h3>
              <p className="text-white/80">Jump back to overview or revisit earlier phases</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => navigate(`/projects/${projectId}`)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Project Overview
              </Button>
              <Button
                className="bg-white text-indigo-600 hover:bg-white/90"
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
