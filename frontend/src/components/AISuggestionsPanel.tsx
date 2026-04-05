import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles, Loader2, RefreshCw, AlertTriangle, TrendingUp, PlusCircle, ArrowRight, X, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';

interface Suggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'missing' | 'improve' | 'risk' | 'next';
}

interface AISuggestionsPanelProps {
  projectId: string;
  phase: string;
  phaseContent?: string;
  projectName?: string;
  projectDescription?: string;
}

const CATEGORY_CONFIG = {
  missing: { icon: PlusCircle,   color: '#F97316', bg: 'rgba(249,115,22,0.1)',  label: 'Missing' },
  improve: { icon: TrendingUp,   color: '#1A6FD4', bg: 'rgba(26,111,212,0.1)',  label: 'Improve' },
  risk:    { icon: AlertTriangle,color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Risk' },
  next:    { icon: ArrowRight,   color: '#3d8fe0', bg: 'rgba(61,143,224,0.1)',  label: 'Next Step' },
};

const PRIORITY_DOT = {
  high:   '#ef4444',
  medium: '#F97316',
  low:    '#1A6FD4',
};

export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  projectId, phase, phaseContent = '', projectName = '', projectDescription = '',
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading]         = useState(false);
  const [collapsed, setCollapsed]     = useState(false);
  const [lastPhase, setLastPhase]     = useState('');

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await (api as any).post(`/projects/${projectId}/suggestions`, {
        phase,
        phase_content: phaseContent.slice(0, 3000),
        project_name: projectName,
        project_description: projectDescription,
      });
      setSuggestions(data?.data?.suggestions || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, phase, phaseContent, projectName, projectDescription]);

  useEffect(() => {
    if (phase && phase !== lastPhase) {
      setLastPhase(phase);
      fetchSuggestions();
    }
  }, [phase, lastPhase, fetchSuggestions]);

  return (
    <div style={{
      background: '#0D1B2A',
      border: '1px solid rgba(26,111,212,0.25)',
      borderRadius: '16px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: collapsed ? 'none' : '1px solid rgba(26,111,212,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(135deg, rgba(26,111,212,0.1), transparent)',
        cursor: 'pointer',
      }} onClick={() => setCollapsed(!collapsed)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={15} color="#1A6FD4" />
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px', color: '#E8EDF5' }}>
            AI Suggestions
          </span>
          {suggestions.length > 0 && (
            <span style={{
              background: 'rgba(26,111,212,0.2)', color: '#3d8fe0',
              fontSize: '10px', fontWeight: 700, padding: '2px 7px',
              borderRadius: '999px', fontFamily: 'Syne, sans-serif',
            }}>
              {suggestions.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); fetchSuggestions(); }}
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a6070', padding: '2px' }}
            title="Refresh suggestions"
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          {collapsed ? <ChevronDown size={14} color="#4a6070" /> : <ChevronUp size={14} color="#4a6070" />}
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div style={{ padding: '12px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', color: '#4a6070' }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '12px', fontFamily: 'DM Sans, sans-serif' }}>Analysing your phase...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#4a6070', fontFamily: 'DM Sans, sans-serif', padding: '8px', textAlign: 'center' }}>
              No suggestions yet — generate phase content first.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {suggestions.map((s, i) => {
                const cat = CATEGORY_CONFIG[s.category] || CATEGORY_CONFIG.improve;
                const CatIcon = cat.icon;
                return (
                  <div key={i} style={{
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(26,46,69,0.6)',
                    borderLeft: `3px solid ${cat.color}`,
                    borderRadius: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '6px',
                        background: cat.bg, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0, marginTop: '1px',
                      }}>
                        <CatIcon size={12} color={cat.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#E8EDF5', fontFamily: 'Syne, sans-serif' }}>
                            {s.title}
                          </span>
                          <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: PRIORITY_DOT[s.priority] || '#4a6070',
                            flexShrink: 0,
                          }} />
                        </div>
                        <p style={{ fontSize: '11px', color: '#8899AA', lineHeight: '1.5', fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                          {s.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AISuggestionsPanel;
