import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Shield,
  Server,
  Scale,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  BarChart3,
  Zap,
  Globe,
  Lock,
  Building,
  Briefcase,
  FileText,
} from 'lucide-react';

interface FeasibilityStudyPhaseProps {
  projectId: string;
  projectName: string;
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  content?: string;
}

interface FeasibilitySection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  items: { label: string; description: string; status?: 'complete' | 'partial' | 'missing' }[];
  score?: number;
}

export const FeasibilityStudyPhase: React.FC<FeasibilityStudyPhaseProps> = ({
  projectId,
  projectName,
  onGenerate,
  isGenerating,
  content,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['market']));
  const [input, setInput] = useState('');

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Feasibility sections with detailed breakdowns
  const feasibilitySections: FeasibilitySection[] = useMemo(() => [
    {
      id: 'market',
      title: 'Market Feasibility',
      icon: <Globe className="h-5 w-5" />,
      color: 'purple',
      score: 78,
      items: [
        { label: 'Problem-Solution Fit', description: 'How well the solution addresses the identified problem', status: 'complete' },
        { label: 'Target Users', description: 'Identified user personas and segments', status: 'complete' },
        { label: 'Competitor Evaluation', description: 'Analysis of existing solutions in the market', status: 'partial' },
        { label: 'Market Size (TAM/SAM/SOM)', description: 'Total addressable market analysis', status: 'partial' },
        { label: 'Risks & Constraints', description: 'Market-related risks and limitations', status: 'missing' },
      ],
    },
    {
      id: 'technical',
      title: 'Technical Feasibility',
      icon: <Server className="h-5 w-5" />,
      color: 'blue',
      score: 85,
      items: [
        { label: 'Proposed Tech Stack', description: 'Recommended technologies and frameworks', status: 'complete' },
        { label: 'Integration Points', description: 'Third-party services and API integrations', status: 'complete' },
        { label: 'Performance Expectations', description: 'Response times, throughput, and reliability targets', status: 'partial' },
        { label: 'Scalability Possibilities', description: 'Horizontal and vertical scaling strategies', status: 'complete' },
        { label: 'Infrastructure Cost Estimates', description: 'Cloud and hosting cost projections', status: 'partial' },
      ],
    },
    {
      id: 'economic',
      title: 'Economic Feasibility',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'green',
      score: 72,
      items: [
        { label: 'Cost Breakdown', description: 'Development, infrastructure, and maintenance costs', status: 'partial' },
        { label: 'Revenue Model', description: 'Monetization strategy and pricing', status: 'complete' },
        { label: 'Break-even Analysis', description: 'Time to profitability projections', status: 'missing' },
        { label: 'ROI Forecast', description: 'Return on investment over 1-5 years', status: 'missing' },
      ],
    },
    {
      id: 'operational',
      title: 'Operational Feasibility',
      icon: <Building className="h-5 w-5" />,
      color: 'amber',
      score: 65,
      items: [
        { label: 'Team Structure', description: 'Required roles and team composition', status: 'complete' },
        { label: 'Workflow', description: 'Development and operational processes', status: 'partial' },
        { label: 'Adoption Barriers', description: 'Potential resistance and change management', status: 'missing' },
        { label: 'Resource Constraints', description: 'Availability of talent and resources', status: 'partial' },
      ],
    },
    {
      id: 'legal',
      title: 'Legal / Compliance Feasibility',
      icon: <Shield className="h-5 w-5" />,
      color: 'red',
      score: 58,
      items: [
        { label: 'Data Privacy', description: 'GDPR, CCPA, and data protection compliance', status: 'partial' },
        { label: 'Security Requirements', description: 'Security standards and certifications needed', status: 'partial' },
        { label: 'Regulatory Risks', description: 'Industry-specific regulations (HIPAA, PCI-DSS, etc.)', status: 'missing' },
      ],
    },
  ], []);

  // Calculate overall feasibility score
  const overallScore = useMemo(() => {
    const scores = feasibilitySections.map((s) => s.score || 0);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [feasibilitySections]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-100';
    if (score >= 60) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-teal-500';
    if (score >= 60) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const sectionColors: Record<string, { bg: string; border: string; icon: string; gradient: string }> = {
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', gradient: 'from-purple-500 to-violet-600' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', gradient: 'from-blue-500 to-indigo-600' },
    green: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', gradient: 'from-amber-500 to-orange-600' },
    red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', gradient: 'from-red-500 to-rose-600' },
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="overflow-hidden">
        <div className={`bg-gradient-to-r ${getScoreGradient(overallScore)} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Feasibility Score</h2>
              <p className="text-white/80 text-sm">Overall project viability assessment</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-white">{overallScore}</div>
                <div className="text-white/80 text-sm">out of 100</div>
              </div>
              <div className="w-24 h-24 relative">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="white"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(overallScore / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-5 gap-4">
            {feasibilitySections.map((section) => {
              const colors = sectionColors[section.color];
              return (
                <div key={section.id} className={`p-3 rounded-lg ${colors.bg} text-center`}>
                  <div className={`text-2xl font-bold ${colors.icon}`}>{section.score}%</div>
                  <div className="text-xs text-gray-600 mt-1">{section.title.split(' ')[0]}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Feasibility Sections */}
      <div className="space-y-4">
        {feasibilitySections.map((section) => {
          const colors = sectionColors[section.color];
          const isExpanded = expandedSections.has(section.id);
          const completedItems = section.items.filter((i) => i.status === 'complete').length;
          const progress = Math.round((completedItems / section.items.length) * 100);

          return (
            <Card key={section.id} className={`border-l-4 ${colors.border} overflow-hidden`}>
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${colors.bg}`}>
                    <span className={colors.icon}>{section.icon}</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-500">
                      {completedItems} of {section.items.length} items documented
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(section.score || 0)}`}>
                    {section.score}%
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100">
                  {/* Progress Bar */}
                  <div className="px-4 py-2 bg-gray-50">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Completion Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors.gradient} transition-all`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Items */}
                  <div className="p-4 space-y-3">
                    {section.items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          item.status === 'complete'
                            ? 'bg-emerald-50 border-emerald-200'
                            : item.status === 'partial'
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {getStatusIcon(item.status)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.label}</div>
                          <div className="text-sm text-gray-500">{item.description}</div>
                        </div>
                        <Badge
                          variant={
                            item.status === 'complete'
                              ? 'success'
                              : item.status === 'partial'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {item.status || 'Not Started'}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {/* AI Generate Button for Section */}
                  <div className="px-4 pb-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => onGenerate(`Generate detailed ${section.title} analysis for the project`)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Generate {section.title} with AI
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* AI Chat for Custom Analysis */}
      <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Feasibility Analysis
          </CardTitle>
          <CardDescription>
            Ask AI to analyze specific aspects of your project's feasibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full border border-purple-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent min-h-[120px] bg-white resize-none"
            placeholder="E.g., 'Analyze the technical feasibility of implementing real-time collaboration features' or 'Evaluate the market potential in the European market'"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => onGenerate(input || 'Generate a comprehensive feasibility study')}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Run Full Analysis
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => onGenerate('Generate TAM/SAM/SOM market analysis')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Market Size
            </Button>
            <Button variant="outline" onClick={() => onGenerate('Generate tech stack recommendation')}>
              <Server className="mr-2 h-4 w-4" />
              Tech Stack
            </Button>
            <Button variant="outline" onClick={() => onGenerate('Generate ROI forecast and break-even analysis')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              ROI Forecast
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Section */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            Feasibility Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div>
              <h4 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Strengths
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span>
                  Strong technical feasibility with proven tech stack
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span>
                  Clear problem-solution fit identified
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span>
                  Scalable architecture proposed
                </li>
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div>
              <h4 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Areas for Improvement
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-1">!</span>
                  Complete regulatory compliance analysis needed
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-1">!</span>
                  Break-even analysis requires more data
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-1">!</span>
                  Adoption barriers need further investigation
                </li>
              </ul>
            </div>
          </div>

          {/* Recommendation */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="font-semibold text-blue-800 mb-2">AI Recommendation</h4>
            <p className="text-sm text-blue-700">
              Based on the current feasibility score of <strong>{overallScore}%</strong>, this project shows
              <strong> moderate to good viability</strong>. Focus on completing the legal/compliance assessment
              and developing a detailed ROI forecast before proceeding to the requirements phase.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeasibilityStudyPhase;
