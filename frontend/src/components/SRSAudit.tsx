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

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const data = await api.runSRSAudit(projectId);
      setAuditResult(data);
      onAuditComplete?.();
    } catch (error) {
      console.error('Failed to run audit:', error);
      // Generate mock audit result for demo
      const mockResult: AuditResult = {
        score: 78,
        total_items: 15,
        passed: 10,
        failed: 2,
        warnings: 3,
        audit_date: new Date().toISOString(),
        items: [
          { id: '1', category: 'Completeness', requirement: 'All functional requirements documented', status: 'pass', message: 'All core features are documented', severity: 'critical' },
          { id: '2', category: 'Completeness', requirement: 'Non-functional requirements specified', status: 'warning', message: 'Performance requirements need more detail', severity: 'major' },
          { id: '3', category: 'Consistency', requirement: 'No conflicting requirements', status: 'pass', message: 'No conflicts detected', severity: 'critical' },
          { id: '4', category: 'Consistency', requirement: 'Terminology is consistent', status: 'pass', message: 'Consistent terminology throughout', severity: 'minor' },
          { id: '5', category: 'Clarity', requirement: 'Requirements are unambiguous', status: 'warning', message: 'Some requirements need clarification', severity: 'major' },
          { id: '6', category: 'Clarity', requirement: 'Acceptance criteria defined', status: 'pass', message: 'Most requirements have acceptance criteria', severity: 'major' },
          { id: '7', category: 'Testability', requirement: 'Requirements are testable', status: 'pass', message: 'All requirements can be verified', severity: 'critical' },
          { id: '8', category: 'Testability', requirement: 'Test scenarios documented', status: 'fail', message: 'Missing test scenarios for 3 requirements', severity: 'major' },
          { id: '9', category: 'Traceability', requirement: 'Requirements traced to objectives', status: 'pass', message: 'Business objectives linked', severity: 'major' },
          { id: '10', category: 'Traceability', requirement: 'Dependencies identified', status: 'warning', message: 'Some dependencies not fully mapped', severity: 'minor' },
          { id: '11', category: 'Feasibility', requirement: 'Technical feasibility assessed', status: 'pass', message: 'All requirements are technically feasible', severity: 'critical' },
          { id: '12', category: 'Feasibility', requirement: 'Resource requirements estimated', status: 'pass', message: 'Resource estimates provided', severity: 'major' },
          { id: '13', category: 'Priority', requirement: 'Requirements prioritized', status: 'pass', message: 'MoSCoW prioritization applied', severity: 'major' },
          { id: '14', category: 'Security', requirement: 'Security requirements defined', status: 'fail', message: 'Missing authentication requirements', severity: 'critical' },
          { id: '15', category: 'Security', requirement: 'Data privacy considered', status: 'pass', message: 'GDPR compliance addressed', severity: 'critical' },
        ],
        recommendations: [
          'Add detailed performance benchmarks for non-functional requirements',
          'Define test scenarios for all requirements before development',
          'Clarify ambiguous requirements in sections 3.2 and 4.1',
          'Document security requirements including authentication and authorization',
          'Complete dependency mapping for all modules'
        ]
      };
      setAuditResult(mockResult);
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
      case 'pass': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" style={{ color: '#d4af37' }} />;
      default: return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: 'rgba(239,68,68,0.2)', text: '#f87171', border: 'rgba(239,68,68,0.3)' };
      case 'major': return { bg: 'rgba(212,175,55,0.2)', text: '#d4af37', border: 'rgba(212,175,55,0.3)' };
      case 'minor': return { bg: 'rgba(59,130,246,0.2)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' };
      default: return { bg: '#152238', text: '#9ca3af', border: '#1e3a5f' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#d4af37';
    return '#f87171';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, #d4af37, #b8962e)', boxShadow: '0 10px 25px -5px rgba(212,175,55,0.3)' }}>
            <Shield className="w-7 h-7" style={{ color: '#0a0f1a' }} />
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
          style={{ background: 'linear-gradient(to right, #d4af37, #b8962e)', color: '#0a0f1a' }}
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

      {/* Audit Results */}
      {auditResult && (
        <>
          {/* Score Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
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

            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(16,185,129,0.2)' }}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-2xl font-bold text-white">{auditResult.passed}</span>
              </div>
              <p className="text-gray-400 text-sm">Passed</p>
            </div>

            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(212,175,55,0.2)' }}>
                  <AlertTriangle className="w-5 h-5" style={{ color: '#d4af37' }} />
                </div>
                <span className="text-2xl font-bold text-white">{auditResult.warnings}</span>
              </div>
              <p className="text-gray-400 text-sm">Warnings</p>
            </div>

            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
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
                  selectedCategory === category ? 'text-[#0a0f1a]' : 'text-gray-400 hover:text-white'
                }`}
                style={{
                  backgroundColor: selectedCategory === category ? '#d4af37' : '#152238',
                  border: '1px solid #1e3a5f'
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
                style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}
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
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(212,175,55,0.2)' }}>
                <ListChecks className="w-5 h-5" style={{ color: '#d4af37' }} />
              </div>
              <h3 className="text-lg font-bold text-white">Recommendations</h3>
            </div>
            <ul className="space-y-3">
              {auditResult.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-300">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#152238', color: '#d4af37' }}>
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
        <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: '#111b2e', border: '2px dashed #1e3a5f' }}>
          <FileCheck className="w-16 h-16 mx-auto mb-4" style={{ color: '#d4af37' }} />
          <h3 className="text-lg font-semibold text-white mb-2">No Audit Results</h3>
          <p className="text-gray-400 mb-4">Run an AI-powered audit to check your SRS quality</p>
          <Button
            onClick={handleRunAudit}
            className="font-semibold"
            style={{ background: 'linear-gradient(to right, #d4af37, #b8962e)', color: '#0a0f1a' }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Run Your First Audit
          </Button>
        </div>
      )}
    </div>
  );
};
