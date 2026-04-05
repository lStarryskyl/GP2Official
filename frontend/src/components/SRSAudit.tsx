import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  FileCheck,
  ListChecks,
  Target,
  Clock,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';

interface AuditItem {
  id: string;
  category: string;
  requirement: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  severity: 'critical' | 'major' | 'minor';
}

interface AuditResult {
  score: number;
  total_items: number;
  passed: number;
  failed: number;
  warnings: number;
  items: AuditItem[];
  recommendations: string[];
  audit_date: string;
}

interface SRSAuditProps {
  projectId: string;
  onAuditComplete?: () => void;
}

export const SRSAudit: React.FC<SRSAuditProps> = ({ projectId, onAuditComplete }) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const handleRunAudit = async () => {
    setIsAuditing(true);
    setError(null);
    try {
      const data = await api.runSrsAudit(projectId);
      setAuditResult(data);
      onAuditComplete?.();
    } catch (error: any) {
      console.error('Failed to run audit:', error);
      setError(error?.response?.data?.detail || 'Audit failed. Check the backend and try again.');
      setAuditResult(null);
    } finally {
      setIsAuditing(false);
    }
  };

  const categories = auditResult 
    ? ['all', ...new Set(auditResult.items.map(item => item.category))]
    : ['all'];

  const filteredItems = auditResult?.items.filter(
    item => selectedCategory === 'all' || item.category === selectedCategory
  ) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-5 h-5 text-blue-400" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" style={{ color: 'var(--blue-400)' }} />;
      default: return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: 'rgba(239,68,68,0.2)', text: '#f87171', border: 'rgba(239,68,68,0.3)' };
      case 'major': return { bg: 'rgba(212,175,55,0.2)', text: 'var(--blue-400)', border: 'rgba(212,175,55,0.3)' };
      case 'minor': return { bg: 'rgba(59,130,246,0.2)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' };
      default: return { bg: '#152238', text: '#9ca3af', border: 'var(--brand-700)' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return 'var(--blue-400)';
    return '#f87171';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, var(--blue-400), #b8962e)', boxShadow: '0 10px 25px -5px rgba(212,175,55,0.3)' }}>
            <Shield className="w-7 h-7" style={{ color: 'var(--brand-900)' }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">SRS Audit</h2>
            <p className="text-gray-400">AI-powered requirements quality analysis</p>
          </div>
        </div>
        
        <Button
          onClick={handleRunAudit}
          disabled={isAuditing}
          className="font-semibold shadow-lg"
          style={{ background: 'linear-gradient(to right, var(--blue-400), #b8962e)', color: 'var(--brand-900)' }}
          data-testid="run-audit-btn"
        >
          {isAuditing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Auditing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {auditResult ? 'Re-run Audit' : 'Run Audit'}
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Audit Results */}
      {auditResult && (
        <>
          {/* Score Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: 'var(--brand-850)', border: '1px solid var(--brand-700)' }}>
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#152238" strokeWidth="8" fill="none" />
                  <circle 
                    cx="48" cy="48" r="40" 
                    stroke={getScoreColor(auditResult.score)} 
                    strokeWidth="8" 
                    fill="none"
                    strokeDasharray={`${auditResult.score * 2.51} 251`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{auditResult.score}%</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">Overall Score</p>
            </div>

            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--brand-850)', border: '1px solid var(--brand-700)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(16,185,129,0.2)' }}>
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-white">{auditResult.passed}</span>
              </div>
              <p className="text-gray-400 text-sm">Passed</p>
            </div>

            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--brand-850)', border: '1px solid var(--brand-700)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(212,175,55,0.2)' }}>
                  <AlertTriangle className="w-5 h-5" style={{ color: 'var(--blue-400)' }} />
                </div>
                <span className="text-2xl font-bold text-white">{auditResult.warnings}</span>
              </div>
              <p className="text-gray-400 text-sm">Warnings</p>
            </div>

            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--brand-850)', border: '1px solid var(--brand-700)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.2)' }}>
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-2xl font-bold text-white">{auditResult.failed}</span>
              </div>
              <p className="text-gray-400 text-sm">Failed</p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category ? 'text-[var(--brand-900)]' : 'text-gray-400 hover:text-white'
                }`}
                style={{
                  backgroundColor: selectedCategory === category ? 'var(--blue-400)' : '#152238',
                  border: '1px solid var(--brand-700)'
                }}
              >
                {category === 'all' ? 'All Categories' : category}
              </button>
            ))}
          </div>

          {/* Audit Items */}
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl p-4 flex items-start gap-4"
                style={{ backgroundColor: 'var(--brand-850)', border: '1px solid var(--brand-700)' }}
                data-testid={`audit-item-${item.id}`}
              >
                {getStatusIcon(item.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{item.requirement}</span>
                    <span 
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: getSeverityColor(item.severity).bg,
                        color: getSeverityColor(item.severity).text,
                        border: `1px solid ${getSeverityColor(item.severity).border}`
                      }}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{item.message}</p>
                  <span className="text-xs text-gray-500 mt-1 inline-block">{item.category}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--brand-850)', border: '1px solid var(--brand-700)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(212,175,55,0.2)' }}>
                <ListChecks className="w-5 h-5" style={{ color: 'var(--blue-400)' }} />
              </div>
              <h3 className="text-lg font-bold text-white">Recommendations</h3>
            </div>
            <ul className="space-y-3">
              {auditResult.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-300">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#152238', color: 'var(--blue-400)' }}>
                    {idx + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Empty State */}
      {!auditResult && !isAuditing && (
        <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--brand-850)', border: '2px dashed var(--brand-700)' }}>
          <FileCheck className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--blue-400)' }} />
          <h3 className="text-lg font-semibold text-white mb-2">No Audit Results</h3>
          <p className="text-gray-400 mb-4">Run an AI-powered audit to check your SRS quality</p>
          <Button
            onClick={handleRunAudit}
            className="font-semibold"
            style={{ background: 'linear-gradient(to right, var(--blue-400), #b8962e)', color: 'var(--brand-900)' }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Run Your First Audit
          </Button>
        </div>
      )}
    </div>
  );
};
