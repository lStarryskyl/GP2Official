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
<<<<<<< HEAD
    if (score >= 80) return 'text-blue-400 bg-blue-900/200/20 border border-blue-500/30';
=======
    if (score >= 80) return 'text-blue-400 bg-blue-900/20 border border-blue-500/30';
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
    if (score >= 60) return 'text-[var(--blue-400)] bg-[var(--blue-400)]/20 border border-[var(--blue-400)]/30';
    return 'text-red-400 bg-red-500/20 border border-red-500/30';
  };

  const getScoreGradient = (score: number) => {
<<<<<<< HEAD
    if (score >= 80) return 'from-blue-900 to-blue-900/100';
=======
    if (score >= 80) return 'from-blue-900 to-blue-800';
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
    if (score >= 60) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-blue-400" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const sectionColors: Record<string, { bg: string; border: string; icon: string; gradient: string }> = {
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: 'text-purple-400', gradient: 'from-purple-500 to-violet-600' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: 'text-blue-400', gradient: 'from-blue-500 to-indigo-600' },
    green: { bg: 'bg-blue-900/10', border: 'border-blue-500/30', icon: 'text-blue-400', gradient: 'from-blue-900 to-teal-600' },
    amber: { bg: 'bg-[var(--blue-400)]/10', border: 'border-[var(--blue-400)]/30', icon: 'text-[var(--blue-400)]', gradient: 'from-[var(--blue-400)] to-[#b8962e]' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: 'text-red-400', gradient: 'from-red-500 to-rose-600' },
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Card - Modern Design */}
      <div className="relative overflow-hidden rounded-3xl bg-[var(--brand-900)] shadow-xl ring-1 ring-[var(--brand-700)]/50">
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
        <div className="p-5 bg-[var(--brand-850)]">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {sections.map((section) => {
              const colors = sectionColors[section.color];
              return (
                <button
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className={`p-4 rounded-2xl ${colors.bg} text-center transition-all hover:scale-105 hover:shadow-md cursor-pointer border ${colors.border} hover:border-[var(--blue-400)]/50`}
                >
                  <div className={`text-2xl font-bold ${colors.icon}`}>{section.score}%</div>
                  <div className="text-xs text-gray-400 mt-1 font-medium">{section.title.split(' ')[0]}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project Context - Modern Card */}
      <div className="rounded-2xl bg-[var(--brand-900)] border border-[var(--brand-700)]/50 p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[var(--blue-400)]/20 rounded-2xl border border-[var(--blue-400)]/30">
              <FileText className="h-6 w-6 text-[var(--blue-400)]" />
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Project Context</p>
              <h3 className="text-lg font-bold text-white">{projectName || 'Current Initiative'}</h3>
            </div>
          </div>
          {projectId && (
            <Badge variant="secondary" className="font-mono bg-[#152238] text-gray-400 border border-[var(--brand-700)]">{projectId}</Badge>
          )}
        </div>
        {content && (
          <p className="text-sm text-gray-400 mt-3 pl-16">
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
            <div key={section.id} className="rounded-2xl bg-[var(--brand-900)] border border-[var(--brand-700)]/50 overflow-hidden transition-all hover:border-[var(--blue-400)]/30">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-[#152238]/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${colors.gradient} shadow-lg`}>
                    <span className="text-white">{section.icon}</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-white">{section.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-gray-500">
                        {completedItems} of {section.items.length} documented
                      </p>
                      <div className="w-24 h-1.5 bg-[var(--brand-700)] rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${colors.gradient} transition-all`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${getScoreColor(section.score || 0)}`}>
                    {section.score}%
                  </div>
                  <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-[var(--brand-700)] rotate-180' : 'bg-[#152238]'}`}>
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-[var(--brand-700)]/30">
                  {/* Progress Bar */}
                  <div className="px-4 py-2 bg-[var(--brand-850)] space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="font-medium text-white">Adjust Section Score</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={section.score || 0}
                        onChange={(e) => handleScoreChange(section.id, Number(e.target.value))}
                        className="flex-1 accent-[var(--blue-400)]"
                      />
                      <span className="font-semibold text-[var(--blue-400)] w-12 text-right">{section.score}%</span>
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
                    <div className="h-2 bg-[var(--brand-700)] rounded-full overflow-hidden">
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
                            ? 'bg-blue-900/10 border-blue-500/30'
                            : item.status === 'partial'
                            ? 'bg-[var(--blue-400)]/10 border-[var(--blue-400)]/30'
                            : 'bg-[#152238] border-[var(--brand-700)]'
                        }`}
                      >
                        {getStatusIcon(item.status)}
                        <div className="flex-1">
                          <div className="font-medium text-white">{item.label}</div>
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
                            className="border border-[var(--brand-700)] rounded-lg px-2 py-1 text-xs bg-[#152238] text-gray-300"
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
            </div>
          );
        })}
      </div>

      {/* AI Feasibility Studies */}
      <div className="bg-[var(--brand-900)] border border-[var(--brand-700)]/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--brand-700)]/30">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--blue-400)]" />
            <h3 className="font-bold text-white">AI Feasibility Studies</h3>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Structured analyses generated for this project and stored with the feasibility phase.
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-400">Your Findings</p>
            <textarea
              className="w-full border border-[var(--brand-700)] rounded-lg px-3 py-2 text-sm min-h-[80px] bg-[#152238] text-white placeholder-gray-500"
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
                  className="border border-[var(--brand-700)] rounded-lg p-3 bg-[#152238]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm text-white truncate">{study.title || 'Feasibility Study'}</h4>
                    {Array.isArray(study.tags) && study.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 ml-2">
                        {study.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] bg-[var(--brand-700)] text-gray-400">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 whitespace-pre-line">
                    {study.body}
                  </p>
                  {study.source && (
                    <p className="mt-1 text-[10px] text-gray-500 uppercase tracking-wide">
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
        </div>
      </div>

      {/* AI Chat for Custom Analysis */}
      <div className="bg-[var(--brand-900)] border border-[var(--brand-700)]/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--brand-700)]/30">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--blue-400)]" />
            <h3 className="font-bold text-white">AI Feasibility Analysis</h3>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Ask AI to analyze specific aspects of your project's feasibility
          </p>
        </div>
        <div className="p-6 space-y-4">
          <textarea
            className="w-full border border-[var(--brand-700)] rounded-lg px-4 py-3 text-sm min-h-[120px] bg-[#152238] text-white placeholder-gray-500 resize-none focus:border-[var(--blue-400)] focus:ring-1 focus:ring-[var(--blue-400)]/30"
            placeholder="E.g., 'Analyze the technical feasibility of implementing real-time collaboration features' or 'Evaluate the market potential in the European market'"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => onGenerate(input || 'Generate a comprehensive feasibility study')}
              disabled={isGenerating}
              className="bg-gradient-to-r from-[var(--blue-400)] to-[#b8962e] hover:from-[#e6c358] hover:to-[var(--blue-400)] text-[var(--brand-900)] font-semibold"
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
            <Button variant="outline" onClick={() => onGenerate('Generate TAM/SAM/SOM market analysis')} className="border-[var(--brand-700)] text-gray-400 hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]">
              <BarChart3 className="mr-2 h-4 w-4" />
              Market Size
            </Button>
            <Button variant="outline" onClick={() => onGenerate('Generate tech stack recommendation')} className="border-[var(--brand-700)] text-gray-400 hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]">
              <Server className="mr-2 h-4 w-4" />
              Tech Stack
            </Button>
            <Button variant="outline" onClick={() => onGenerate('Generate ROI forecast and break-even analysis')} className="border-[var(--brand-700)] text-gray-400 hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]">
              <TrendingUp className="mr-2 h-4 w-4" />
              ROI Forecast
            </Button>
          </div>
        </div>
      </div>

      {/* Feasibility Summary */}
      <div className="bg-[var(--brand-900)] border border-[var(--brand-700)]/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--brand-700)]/30">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--blue-400)]" />
            <h3 className="font-bold text-white">Feasibility Summary</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
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
              <div className="space-y-2 text-sm text-gray-400">
                {latestStudy?.title && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                    <span className="font-semibold text-white">{latestStudy.title}</span>
                  </div>
                )}
                {lines.slice(0, 6).map((line: string, idx: number) => (
                  <p key={idx} className="text-sm text-gray-400">
                    {line}
                  </p>
                ))}
                {lines.length > 6 && (
                  <p className="text-xs text-gray-500">...and more in the latest AI study</p>
                )}
                {Array.isArray(latestStudy?.tags) && latestStudy.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {latestStudy.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] bg-[var(--brand-700)] text-gray-400">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default FeasibilityStudyPhase;
