import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  Shield,
  Server,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  BarChart3,
  Zap,
  Globe,
  Building,
  FileText,
} from 'lucide-react';
import { api } from '@/lib/api';

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
  items: { label: string; description: string; status?: FeasibilityStatus }[];
  score?: number;
}

type FeasibilityStatus = 'complete' | 'partial' | 'missing';

const FEASIBILITY_STATUS_OPTIONS: FeasibilityStatus[] = ['complete', 'partial', 'missing'];

const createInitialSections = (): FeasibilitySection[] => [
  {
    id: 'market',
    title: 'Market Feasibility',
    icon: <Globe className="h-5 w-5" />,
    color: 'purple',
    score: 0,
    items: [
      { label: 'Problem-Solution Fit', description: 'How well the solution addresses the identified problem', status: 'missing' },
      { label: 'Target Users', description: 'Identified user personas and segments', status: 'missing' },
      { label: 'Competitor Evaluation', description: 'Analysis of existing solutions in the market', status: 'missing' },
      { label: 'Market Size (TAM/SAM/SOM)', description: 'Total addressable market analysis', status: 'missing' },
      { label: 'Risks & Constraints', description: 'Market-related risks and limitations', status: 'missing' },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Feasibility',
    icon: <Server className="h-5 w-5" />,
    color: 'blue',
    score: 0,
    items: [
      { label: 'Proposed Tech Stack', description: 'Recommended technologies and frameworks', status: 'missing' },
      { label: 'Integration Points', description: 'Third-party services and API integrations', status: 'missing' },
      { label: 'Performance Expectations', description: 'Response times, throughput, and reliability targets', status: 'missing' },
      { label: 'Scalability Possibilities', description: 'Horizontal and vertical scaling strategies', status: 'missing' },
      { label: 'Infrastructure Cost Estimates', description: 'Cloud and hosting cost projections', status: 'missing' },
    ],
  },
  {
    id: 'economic',
    title: 'Economic Feasibility',
    icon: <DollarSign className="h-5 w-5" />,
    color: 'green',
    score: 0,
    items: [
      { label: 'Cost Breakdown', description: 'Development, infrastructure, and maintenance costs', status: 'missing' },
      { label: 'Revenue Model', description: 'Monetization strategy and pricing', status: 'missing' },
      { label: 'Break-even Analysis', description: 'Time to profitability projections', status: 'missing' },
      { label: 'ROI Forecast', description: 'Return on investment over 1-5 years', status: 'missing' },
    ],
  },
  {
    id: 'operational',
    title: 'Operational Feasibility',
    icon: <Building className="h-5 w-5" />, 
    color: 'amber',
    score: 0,
    items: [
      { label: 'Team Structure', description: 'Required roles and team composition', status: 'missing' },
      { label: 'Workflow', description: 'Development and operational processes', status: 'missing' },
      { label: 'Adoption Barriers', description: 'Potential resistance and change management', status: 'missing' },
      { label: 'Resource Constraints', description: 'Availability of talent and resources', status: 'missing' },
    ],
  },
  {
    id: 'legal',
    title: 'Legal / Compliance Feasibility',
    icon: <Shield className="h-5 w-5" />, 
    color: 'red',
    score: 0,
    items: [
      { label: 'Data Privacy', description: 'GDPR, CCPA, and data protection compliance', status: 'missing' },
      { label: 'Security Requirements', description: 'Security standards and certifications needed', status: 'missing' },
      { label: 'Regulatory Risks', description: 'Industry-specific regulations (HIPAA, PCI-DSS, etc.)', status: 'missing' },
    ],
  },
];

const withIcons = (sections: Omit<FeasibilitySection, 'icon'>[]): FeasibilitySection[] => {
  const base = createInitialSections();
  const iconById: Record<string, React.ReactNode> = {};
  base.forEach((s) => {
    iconById[s.id] = s.icon;
  });
  return sections.map((s) => ({
    ...s,
    icon: iconById[s.id] ?? <FileText className="h-5 w-5" />,
  }));
};

export const FeasibilityStudyPhase: React.FC<FeasibilityStudyPhaseProps> = ({
  projectId,
  projectName,
  onGenerate,
  isGenerating,
  content,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['market']));
  const [input, setInput] = useState('');
  const [sections, setSections] = useState<FeasibilitySection[]>(() => createInitialSections());
  const [studies, setStudies] = useState<any[]>([]);
  const [userFindings, setUserFindings] = useState('');

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      try {
        const [studyData, sectionData] = await Promise.all([
          api.getFeasibilityStudies(projectId),
          api.getFeasibilitySections(projectId),
        ]);
        if (!cancelled) {
          setStudies(studyData.studies || []);
          if (Array.isArray(sectionData.sections) && sectionData.sections.length > 0) {
            // Reconstruct icons client-side; backend only stores serializable fields
            setSections(
              withIcons(
                sectionData.sections.map((s: any) => ({
                  id: s.id,
                  title: s.title,
                  color: s.color,
                  items: s.items,
                  score: s.score,
                }))
              )
            );
          } else {
            await api.saveFeasibilitySections(projectId, { sections: createInitialSections() });
          }
        }
      } catch (err) {
        console.error('Failed to load feasibility data', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const persistStudies = async (nextStudies: any[]) => {
    if (!projectId) return;
    try {
      await api.saveFeasibilityStudies(projectId, { studies: nextStudies });
      setStudies(nextStudies);
    } catch (err) {
      console.error('Failed to save feasibility studies', err);
    }
  };

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

  const overallScore = useMemo(() => {
    const scores = sections.map((s) => s.score || 0);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [sections]);

  const saveSections = async (nextSections: FeasibilitySection[]) => {
    setSections(nextSections);
    if (!projectId) return;
    try {
      // Strip React elements before sending to backend
      const payload = nextSections.map(({ icon, ...rest }) => rest);
      await api.saveFeasibilitySections(projectId, { sections: payload });
    } catch (err) {
      console.error('Failed to save feasibility sections', err);
    }
  };

  const handleStatusChange = (sectionId: string, itemIndex: number, status: FeasibilityStatus) => {
    saveSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item, idx) => (idx === itemIndex ? { ...item, status } : item)),
            }
          : section
      )
    );
  };

  const handleScoreChange = (sectionId: string, score: number) => {
    saveSections(
      sections.map((section) => (section.id === sectionId ? { ...section, score } : section))
    );
  };

  const markSectionComplete = (sectionId: string) => {
    saveSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              score: 100,
              items: section.items.map((item) => ({ ...item, status: 'complete' })),
            }
          : section
      )
    );
  };

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
      {/* Overall Score Card - Modern Design */}
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5">
        <div className={`bg-gradient-to-br ${getScoreGradient(overallScore)} p-8`}>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <span className="text-white/80 text-sm font-medium uppercase tracking-wider">Viability Assessment</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Feasibility Score</h2>
              <p className="text-white/70 text-sm max-w-sm">Comprehensive analysis of project viability across market, technical, economic, operational, and legal dimensions</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.15)" strokeWidth="10" fill="none" />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="white"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${(overallScore / 100) * 351.86} 351.86`}
                    strokeLinecap="round"
                    className="drop-shadow-lg"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-white">{overallScore}</div>
                  <div className="text-white/70 text-xs">/ 100</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-5 bg-gradient-to-b from-slate-50 to-white">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {sections.map((section) => {
              const colors = sectionColors[section.color];
              return (
                <button
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className={`p-4 rounded-2xl ${colors.bg} text-center transition-all hover:scale-105 hover:shadow-md cursor-pointer border-2 border-transparent hover:border-current ${colors.border}`}
                >
                  <div className={`text-2xl font-bold ${colors.icon}`}>{section.score}%</div>
                  <div className="text-xs text-gray-600 mt-1 font-medium">{section.title.split(' ')[0]}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project Context - Modern Card */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100/50 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500 font-semibold tracking-wider">Project Context</p>
              <h3 className="text-lg font-bold text-slate-900">{projectName || 'Current Initiative'}</h3>
            </div>
          </div>
          {projectId && (
            <Badge variant="secondary" className="font-mono bg-white/80 text-slate-600">{projectId}</Badge>
          )}
        </div>
        {content && (
          <p className="text-sm text-slate-600 mt-3 pl-16">
            {content.slice(0, 240)}{content.length > 240 ? '…' : ''}
          </p>
        )}
      </div>

      {/* Feasibility Sections - Modern Accordion */}
      <div className="space-y-4">
        {sections.map((section) => {
          const colors = sectionColors[section.color];
          const isExpanded = expandedSections.has(section.id);
          const completedItems = section.items.filter((i) => i.status === 'complete').length;
          const progress = Math.round((completedItems / section.items.length) * 100);

          return (
            <div key={section.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden transition-all hover:shadow-md">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${colors.gradient} shadow-lg`}>
                    <span className="text-white">{section.icon}</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-900">{section.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-slate-500">
                        {completedItems} of {section.items.length} documented
                      </p>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${colors.gradient} transition-all`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${getScoreColor(section.score || 0)} shadow-sm`}>
                    {section.score}%
                  </div>
                  <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-slate-100 rotate-180' : 'bg-slate-50'}`}>
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100">
                  {/* Progress Bar */}
                  <div className="px-4 py-2 bg-gray-50 space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <span className="font-medium text-gray-900">Adjust Section Score</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={section.score || 0}
                        onChange={(e) => handleScoreChange(section.id, Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="font-semibold text-gray-900 w-12 text-right">{section.score}%</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markSectionComplete(section.id)}
                      >
                        Mark Section Complete
                      </Button>
                    </div>
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
                        <div className="flex flex-col items-end gap-1">
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
                          <select
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                            value={item.status || 'missing'}
                            onChange={(e) =>
                              handleStatusChange(section.id, idx, e.target.value as FeasibilityStatus)
                            }
                          >
                            {FEASIBILITY_STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
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

      {/* AI Feasibility Studies */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-sky-50">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            AI Feasibility Studies
          </CardTitle>
          <CardDescription>
            Structured analyses generated for this project and stored with the feasibility phase.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Your Findings</p>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[80px]"
              placeholder="Write your own feasibility notes here. AI can help refine and structure them."
              value={userFindings}
              onChange={(e) => setUserFindings(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                disabled={isGenerating || !userFindings.trim()}
                onClick={async () => {
                  const summary = sections
                    .map((s) => `${s.title}: score=${s.score ?? 0}`)
                    .join('; ');
                  const prompt = `Refine these feasibility findings and turn them into a structured study. Findings: ${userFindings}. Section scores: ${summary}.`;
                  await onGenerate(prompt);
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refining...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Ask AI to refine
                  </>
                )}
              </Button>
            </div>
          </div>

          {studies.length === 0 ? (
            <p className="text-sm text-gray-500">No AI studies have been saved yet for this project.</p>
          ) : (
            <div className="space-y-3">
              {studies.map((study) => (
                <div
                  key={study.id}
                  className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm text-gray-900 truncate">{study.title || 'Feasibility Study'}</h4>
                    {Array.isArray(study.tags) && study.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 ml-2">
                        {study.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 whitespace-pre-line">
                    {study.body}
                  </p>
                  {study.source && (
                    <p className="mt-1 text-[10px] text-gray-400 uppercase tracking-wide">
                      Source: {study.source}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          {studies.length > 0 && (
            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => persistStudies(studies)}
              >
                Save studies
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Feasibility Summary */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            Feasibility Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            const latestStudy = studies[studies.length - 1];
            const summaryText = latestStudy?.body?.trim() || content?.trim();
            if (!summaryText) {
              return (
                <p className="text-sm text-gray-500">
                  No feasibility summary generated yet. Run an AI study or paste your findings above to capture them here.
                </p>
              );
            }
            const lines = summaryText.split('\n').filter((line: string) => line.trim());
            return (
              <div className="space-y-2 text-sm text-gray-700">
                {latestStudy?.title && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="font-semibold text-gray-900">{latestStudy.title}</span>
                  </div>
                )}
                {lines.slice(0, 6).map((line: string, idx: number) => (
                  <p key={idx} className="text-sm text-gray-700">
                    {line}
                  </p>
                ))}
                {lines.length > 6 && (
                  <p className="text-xs text-gray-500">...and more in the latest AI study</p>
                )}
                {Array.isArray(latestStudy?.tags) && latestStudy.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {latestStudy.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};

export default FeasibilityStudyPhase;
