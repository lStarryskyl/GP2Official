/**
 * AIAgentsPanel — Panel to run specialized AI agents on a project
 *
 * Shows buttons for:
 *   - Conflict Detection
 *   - Tech Stack Recommender
 *   - Security Audit
 *   - User Story Generator
 *   - API Design
 *   - Database Schema
 *
 * Renders results inline with formatted JSON / markdown display.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  Shield,
  Layers,
  FileText,
  Database,
  GitBranch,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';

interface AgentConfig {
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const AGENTS: AgentConfig[] = [
  {
    type: 'conflict_detection',
    name: 'Conflict Detection',
    description: 'Scan requirements for contradictions and ambiguities',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: '#C1440E',
  },
  {
    type: 'tech_stack_recommendation',
    name: 'Tech Stack Recommender',
    description: 'Get the optimal technology stack for your project',
    icon: <Layers className="w-4 h-4" />,
    color: '#2A9D8F',
  },
  {
    type: 'security_audit',
    name: 'Security Audit',
    description: 'OWASP-based security gap analysis of your requirements',
    icon: <Shield className="w-4 h-4" />,
    color: '#6B4C8A',
  },
  {
    type: 'user_story_generation',
    name: 'User Story Generator',
    description: 'Convert requirements into Agile user stories with acceptance criteria',
    icon: <FileText className="w-4 h-4" />,
    color: '#7BA05B',
  },
  {
    type: 'api_design',
    name: 'API Design Agent',
    description: 'Generate REST API specification with all endpoints',
    icon: <GitBranch className="w-4 h-4" />,
    color: '#D4A017',
  },
  {
    type: 'database_schema',
    name: 'Database Schema Agent',
    description: 'Design normalized database schema with ERD',
    icon: <Database className="w-4 h-4" />,
    color: '#8B5E3C',
  },
];

interface Props {
  projectId: string;
  projectName: string;
  description?: string;
  requirements?: any[];
}

interface AgentResult {
  type: string;
  name: string;
  data: any;
  error?: string;
  color: string;
}

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    critical: { bg: 'rgba(193,68,14,0.15)', text: '#C1440E' },
    high: { bg: 'rgba(212,160,23,0.15)', text: '#D4A017' },
    medium: { bg: 'rgba(95,122,138,0.15)', text: '#5F7A8A' },
    low: { bg: 'rgba(123,160,91,0.15)', text: '#7BA05B' },
    info: { bg: 'rgba(42,157,143,0.15)', text: '#2A9D8F' },
  };
  const c = colors[severity?.toLowerCase()] || colors.info;
  return (
    <span className="px-2 py-0.5 rounded text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}>
      {severity?.toUpperCase()}
    </span>
  );
};

const ConflictResultView: React.FC<{ data: any }> = ({ data }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: 'rgba(15,31,21,0.8)', border: '1px solid rgba(26,46,69,0.4)' }}>
      <div className="text-center">
        <p className="text-2xl font-bold text-[var(--text-primary)]">{data.summary?.total_conflicts ?? 0}</p>
        <p className="text-xs text-[var(--text-muted)]">Total Conflicts</p>
      </div>
      <div className="flex gap-3 text-sm">
        {[['critical', '#C1440E'], ['high', '#D4A017'], ['medium', '#5F7A8A'], ['low', '#7BA05B']].map(([k, c]) => (
          <span key={k}>
            <span className="font-bold" style={{ color: c }}>{data.summary?.[`${k}_count`] ?? 0}</span>
            <span className="text-[#4a7a56] ml-1">{k}</span>
          </span>
        ))}
      </div>
      <p className="text-xs text-[var(--text-muted)] flex-1">Score: {data.summary?.overall_quality_score ?? '—'}/100</p>
    </div>
    {(data.conflicts || []).map((c: any) => (
      <div key={c.conflict_id} className="p-3 rounded-xl" style={{ background: 'var(--brand-800)', border: '1px solid rgba(26,46,69,0.5)' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[var(--text-primary)] text-sm font-semibold">{c.title}</span>
          <SeverityBadge severity={c.severity} />
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-1.5">{c.description}</p>
        <p className="text-xs text-[var(--blue-400)]">💡 {c.suggested_resolution}</p>
      </div>
    ))}
  </div>
);

const TechStackResultView: React.FC<{ data: any }> = ({ data }) => {
  const stack = data.recommended_stack || {};
  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-muted)]">{data.summary}</p>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(stack).map(([layer, info]: [string, any]) => (
          <div key={layer} className="p-3 rounded-xl" style={{ background: 'var(--brand-800)', border: '1px solid rgba(26,46,69,0.5)' }}>
            <p className="text-xs font-bold text-[var(--blue-400)] uppercase mb-2">{layer}</p>
            {typeof info === 'object' && Object.entries(info).filter(([k]) => k !== 'rationale').map(([k, v]) => (
              <p key={k} className="text-xs text-[var(--text-muted)]">
                <span className="text-[var(--text-muted)]">{k}: </span>{String(v)}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const SecurityResultView: React.FC<{ data: any }> = ({ data }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'rgba(15,31,21,0.8)', border: '1px solid rgba(26,46,69,0.4)' }}>
      <div className="text-center">
        <p className="text-2xl font-bold" style={{ color: data.security_score > 70 ? 'var(--blue-400)' : data.security_score > 50 ? '#D4A017' : '#C1440E' }}>
          {data.security_score}/100
        </p>
        <p className="text-xs text-[var(--text-muted)]">Security Score</p>
      </div>
      <SeverityBadge severity={data.risk_level} />
      <p className="text-xs text-[var(--text-muted)] flex-1">{data.executive_summary}</p>
    </div>
    {(data.findings || []).map((f: any) => (
      <div key={f.finding_id} className="p-3 rounded-xl" style={{ background: 'var(--brand-800)', border: '1px solid rgba(26,46,69,0.5)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[var(--text-primary)] text-sm font-semibold">{f.title}</span>
          <SeverityBadge severity={f.severity} />
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-1">{f.description}</p>
        <p className="text-xs text-[#D4A017]">OWASP: {f.owasp_category}</p>
        <p className="text-xs text-[var(--blue-400)] mt-1">Fix: {f.recommendation}</p>
      </div>
    ))}
  </div>
);

const GenericJsonView: React.FC<{ data: any; color: string }> = ({ data, color }) => (
  <div className="rounded-xl overflow-hidden" style={{ background: 'var(--brand-900)', border: '1px solid rgba(26,46,69,0.5)' }}>
    <pre className="text-xs text-[var(--text-muted)] p-4 overflow-auto max-h-80">
      {JSON.stringify(data, null, 2)}
    </pre>
  </div>
);

const ResultView: React.FC<{ type: string; data: any; color: string }> = ({ type, data, color }) => {
  if (type === 'conflict_detection') return <ConflictResultView data={data} />;
  if (type === 'tech_stack_recommendation') return <TechStackResultView data={data} />;
  if (type === 'security_audit') return <SecurityResultView data={data} />;
  return <GenericJsonView data={data} color={color} />;
};

export const AIAgentsPanel: React.FC<Props> = ({
  projectId,
  projectName,
  description = '',
  requirements = [],
}) => {
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, AgentResult>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  const handleEscKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, handleEscKey]);

  const runAgent = async (agent: AgentConfig) => {
    setRunningAgent(agent.type);
    try {
      const res = await api.post('/ai-chat/agent-task', {
        project_id: projectId,
        project_name: projectName,
        description,
        task_type: agent.type,
        requirements,
      });
      setResults(prev => ({
        ...prev,
        [agent.type]: { type: agent.type, name: agent.name, data: res.data.content, color: agent.color },
      }));
      setExpanded(prev => ({ ...prev, [agent.type]: true }));
    } catch (e: any) {
      const status = e?.response?.status;
      const detail = e?.response?.data?.detail || e?.message || 'Agent failed';
      const friendlyError = status === 429
        ? 'Daily AI quota reached — resets at midnight PT. Try again tomorrow or upgrade your Gemini API plan.'
        : detail;
      setResults(prev => ({
        ...prev,
        [agent.type]: { type: agent.type, name: agent.name, data: null, error: friendlyError, color: agent.color },
      }));
    } finally {
      setRunningAgent(null);
    }
  };

  // Signal open state to other floating panels (e.g. AIDebatePanel) via body attribute
  useEffect(() => {
    if (isOpen) {
      document.body.setAttribute('data-ai-agents-open', 'true');
    } else {
      document.body.removeAttribute('data-ai-agents-open');
    }
    return () => document.body.removeAttribute('data-ai-agents-open');
  }, [isOpen]);

  return (
    <>
      {/* Toggle button — only visible when panel is closed */}
      {!isOpen && (
        <button
          ref={toggleBtnRef}
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Agents panel"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-xl transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, var(--brand-600), var(--blue-400))',
            color: 'var(--brand-900)',
            boxShadow: '0 8px 24px rgba(26,111,212,0.25)',
          }}
        >
          <Sparkles className="w-4 h-4" />
          AI Agents
        </button>
      )}

      {/* Backdrop overlay — click to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60]"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-in Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed right-0 top-0 bottom-0 z-[70] overflow-y-auto shadow-2xl"
          style={{
            width: '360px',
            background: 'var(--brand-850)',
            borderLeft: '1px solid rgba(26,111,212,0.25)',
            animation: 'slideInRight 0.25s ease-out',
          }}
        >
          <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4"
            style={{ background: 'var(--brand-850)', borderBottom: '1px solid rgba(26,46,69,0.4)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(26,111,212,0.15)', border: '1px solid rgba(26,111,212,0.3)' }}>
              <Sparkles className="w-4 h-4 text-[var(--blue-400)]" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--text-primary)] text-sm">AI Agents</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Specialized analysis tools</p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {AGENTS.map(agent => {
              const result = results[agent.type];
              const isRunning = runningAgent === agent.type;
              const isExpanded = expanded[agent.type];

              return (
                <div key={agent.type} className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--brand-800)', border: `1px solid ${agent.color}25` }}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${agent.color}18`, color: agent.color, border: `1px solid ${agent.color}30` }}>
                          {agent.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)] text-sm">{agent.name}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">{agent.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => runAgent(agent)}
                        disabled={!!runningAgent}
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                        style={{ background: agent.color, color: 'var(--brand-900)' }}
                      >
                        {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Run'}
                      </button>
                    </div>

                    {/* Result toggle */}
                    {result && (
                      <button
                        onClick={() => setExpanded(prev => ({ ...prev, [agent.type]: !isExpanded }))}
                        className="mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors"
                        style={{ color: result.error ? '#C1440E' : agent.color }}
                      >
                        {result.error
                          ? <><AlertTriangle className="w-3 h-3" />Error — click to view</>
                          : <><CheckCircle2 className="w-3 h-3" />Result ready</>
                        }
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {result && isExpanded && (
                    <div className="px-4 pb-4">
                      {result.error
                        ? <p className="text-xs text-[#C1440E]">{result.error}</p>
                        : <ResultView type={agent.type} data={result.data} color={agent.color} />
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default AIAgentsPanel;
