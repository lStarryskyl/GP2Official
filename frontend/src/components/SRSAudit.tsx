import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, Loader2, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';

interface AuditFinding {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
}

interface AuditReport {
  overall_score: number;
  completeness_score: number;
  consistency_score: number;
  clarity_score: number;
  testability_score: number;
  findings: AuditFinding[];
  summary: string;
}

interface SRSAuditProps {
  projectId: string;
}

export const SRSAudit: React.FC<SRSAuditProps> = ({ projectId }) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const data = await api.runSrsAudit(projectId);
      setReport(data);
    } catch (error) {
      console.error('Failed to run audit:', error);
      alert('Failed to run SRS audit. Please try again.');
    } finally {
      setIsAuditing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-300';
    if (score >= 60) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-navy-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">SRS Audit</h2>
            <p className="text-gray-600">Comprehensive requirements analysis</p>
          </div>
        </div>
        
        <Button
          onClick={handleRunAudit}
          disabled={isAuditing}
          className="bg-gradient-to-r from-blue-500 to-navy-600 hover:from-blue-600 hover:to-navy-700 text-white shadow-lg"
        >
          {isAuditing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Auditing...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 mr-2" />
              Run SRS Audit
            </>
          )}
        </Button>
      </div>

      {/* Audit Report */}
      {report && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-blue-50 to-navy-50 rounded-2xl p-8 border-2 border-blue-200">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBg(report.overall_score)} border-4 mb-4`}>
                <span className={`text-4xl font-bold ${getScoreColor(report.overall_score)}`}>
                  {report.overall_score}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Overall Quality Score</h3>
              <p className="text-gray-600">{report.summary}</p>
            </div>
          </div>

          {/* Category Scores */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Completeness</span>
                <CheckCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(report.completeness_score)}`}>
                {report.completeness_score}
              </div>
            </div>

            <div className="bg-white border-2 border-orange-200 rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Consistency</span>
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(report.consistency_score)}`}>
                {report.consistency_score}
              </div>
            </div>

            <div className="bg-white border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Clarity</span>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(report.clarity_score)}`}>
                {report.clarity_score}
              </div>
            </div>

            <div className="bg-white border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Testability</span>
                <ShieldCheck className="w-5 h-5 text-purple-500" />
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(report.testability_score)}`}>
                {report.testability_score}
              </div>
            </div>
          </div>

          {/* Findings */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Findings & Recommendations
            </h3>
            
            <div className="space-y-4">
              {report.findings.map((finding, idx) => (
                <div
                  key={idx}
                  className={`border-2 rounded-xl p-4 ${getSeverityColor(finding.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wide">
                        {finding.category}
                      </span>
                      <span className="ml-2 text-xs font-semibold px-2 py-1 rounded-full bg-white/50">
                        {finding.severity}
                      </span>
                    </div>
                  </div>
                  <p className="font-semibold mb-2">{finding.description}</p>
                  <div className="bg-white/50 rounded-lg p-3 mt-2">
                    <p className="text-sm">
                      <span className="font-semibold">Recommendation:</span> {finding.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!report && !isAuditing && (
        <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-navy-50 rounded-2xl border-2 border-dashed border-blue-200">
          <ShieldCheck className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Audit Report Yet</h3>
          <p className="text-gray-600 mb-4">Run a comprehensive SRS audit to identify issues and improvements</p>
          <Button
            onClick={handleRunAudit}
            className="bg-gradient-to-r from-blue-500 to-navy-600 text-white"
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Run Your First Audit
          </Button>
        </div>
      )}
    </div>
  );
};
