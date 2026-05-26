import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Swords, X, Trophy, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';

interface DebateRound {
  agent: string;
  argument: string;
}

interface DebateResponse {
  topic: string;
  rounds: DebateRound[];
  verdict: string;
}

interface AIDebatePanelProps {
  projectId: string;
  projectContext?: string;
}

export const AIDebatePanel: React.FC<AIDebatePanelProps> = ({ projectId, projectContext = '' }) => {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebateResponse | null>(null);
  const [error, setError] = useState('');
  const [verdictExpanded, setVerdictExpanded] = useState(true);
  const [agentsPanelOpen, setAgentsPanelOpen] = useState(false);
  const [athenaChatOpen, setAthenaChatOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Watch for AI Agents panel and Athena chat open/close via body attributes
  useEffect(() => {
    const checkAttr = () => {
      setAgentsPanelOpen(document.body.hasAttribute('data-ai-agents-open'));
      setAthenaChatOpen(document.body.hasAttribute('data-athena-chat-open'));
    };
    checkAttr(); // initial check
    const observer = new MutationObserver(checkAttr);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-ai-agents-open', 'data-athena-chat-open'] });
    return () => observer.disconnect();
  }, []);

  // Close on click outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      panelRef.current &&
      !panelRef.current.contains(e.target as Node) &&
      toggleRef.current &&
      !toggleRef.current.contains(e.target as Node)
    ) {
      setOpen(false);
    }
  }, []);

  // Close on Escape key
  const handleEscKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [open, handleClickOutside, handleEscKey]);

  const startDebate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const data = await api.post(`/projects/${projectId}/debate`, {
        topic,
        context: projectContext,
      });
      setResult(data.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Debate failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const suggestionTopics = [
    'Microservices vs monolith architecture',
    'REST API vs GraphQL for this project',
    'SQL vs NoSQL for the data model',
    'Build vs buy this component',
    'Mobile-first vs desktop-first design',
  ];

  // Hide entirely when AI Agents panel or Athena chat is open
  if (agentsPanelOpen || athenaChatOpen) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        ref={toggleRef}
        onClick={() => setOpen(!open)}
        title={open ? 'Close AI Debate' : 'AI Debate'}
        aria-label={open ? 'Close AI Debate panel' : 'Open AI Debate panel'}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          zIndex: 1000,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: open
            ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
            : 'linear-gradient(135deg, #1A6FD4, #0d2b52)',
          border: open
            ? '1px solid rgba(239,68,68,0.5)'
            : '1px solid rgba(26,111,212,0.5)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: open
            ? '0 4px 20px rgba(239,68,68,0.4)'
            : '0 4px 20px rgba(26,111,212,0.4)',
          transition: 'all 0.25s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open ? <X size={20} /> : <Swords size={20} />}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            bottom: '150px',
            right: '24px',
            width: '400px',
            maxHeight: '600px',
            overflowY: 'auto',
            background: '#0D1B2A',
            border: '1px solid rgba(26,111,212,0.4)',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeInUp 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(26,111,212,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(26,111,212,0.15), rgba(13,27,42,0.8))',
            borderRadius: '16px 16px 0 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Swords size={18} color="#1A6FD4" />
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#E8EDF5', fontSize: '15px' }}>
                AI Debate Arena
              </span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899AA' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Topic input */}
            <div>
              <label style={{ fontSize: '12px', color: '#8899AA', fontFamily: 'DM Sans, sans-serif', display: 'block', marginBottom: '6px' }}>
                Topic to debate
              </label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Should we use microservices or a monolith?"
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#1A2E45',
                  border: '1px solid rgba(26,111,212,0.3)',
                  borderRadius: '8px',
                  color: '#E8EDF5',
                  fontSize: '13px',
                  fontFamily: 'DM Sans, sans-serif',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Suggestions */}
            {!result && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {suggestionTopics.map(s => (
                  <button
                    key={s}
                    onClick={() => setTopic(s)}
                    style={{
                      padding: '4px 10px',
                      background: 'rgba(26,111,212,0.1)',
                      border: '1px solid rgba(26,111,212,0.3)',
                      borderRadius: '999px',
                      color: '#70b3ee',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Start button */}
            <button
              onClick={startDebate}
              disabled={loading || !topic.trim()}
              style={{
                padding: '10px',
                background: topic.trim() && !loading ? 'linear-gradient(135deg, #F97316, #cc4900)' : 'rgba(249,115,22,0.2)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '13px',
                fontFamily: 'Syne, sans-serif',
                cursor: topic.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Agents deliberating...
                </>
              ) : (
                <>
                  <Swords size={14} />
                  Start Debate
                </>
              )}
            </button>

            {error && (
              <p style={{ color: '#ef4444', fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>{error}</p>
            )}

            {/* Debate result */}
            {result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Advocate */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(26,111,212,0.1)',
                  border: '1px solid rgba(26,111,212,0.3)',
                  borderRadius: '10px',
                  borderLeft: '3px solid #1A6FD4',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#3d8fe0', marginBottom: '6px', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Advocate — FOR
                  </div>
                  <p style={{ fontSize: '12px', color: '#E8EDF5', lineHeight: '1.6', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                    {result.rounds[0]?.argument}
                  </p>
                </div>

                {/* Critic */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(249,115,22,0.08)',
                  border: '1px solid rgba(249,115,22,0.3)',
                  borderRadius: '10px',
                  borderLeft: '3px solid #F97316',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#fb9042', marginBottom: '6px', fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Critic — AGAINST
                  </div>
                  <p style={{ fontSize: '12px', color: '#E8EDF5', lineHeight: '1.6', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                    {result.rounds[1]?.argument}
                  </p>
                </div>

                {/* Verdict */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                }}>
                  <button
                    onClick={() => setVerdictExpanded(!verdictExpanded)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#E8EDF5', width: '100%', padding: 0, marginBottom: verdictExpanded ? '8px' : 0,
                    }}
                  >
                    <Trophy size={14} color="#F97316" />
                    <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1, textAlign: 'left' }}>
                      Moderator Verdict
                    </span>
                    {verdictExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {verdictExpanded && (
                    <p style={{ fontSize: '12px', color: '#E8EDF5', lineHeight: '1.6', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                      {result.verdict}
                    </p>
                  )}
                </div>

                {/* New debate */}
                <button
                  onClick={() => { setResult(null); setTopic(''); }}
                  style={{
                    padding: '8px',
                    background: 'rgba(26,111,212,0.1)',
                    border: '1px solid rgba(26,111,212,0.3)',
                    borderRadius: '8px',
                    color: '#3d8fe0',
                    fontSize: '12px',
                    fontFamily: 'DM Sans, sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  New debate
                </button>
              </div>
            )}
          </div>

          <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(26,111,212,0.2)', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', color: '#4a6070', fontFamily: 'DM Sans, sans-serif' }}>
              Powered by Gemini AI · Advocate vs Critic
            </span>
          </div>
        </div>
      )}

      {/* Inline keyframe for panel entrance animation */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default AIDebatePanel;
