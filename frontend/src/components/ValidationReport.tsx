import React, { useState } from 'react';
import { ValidationScoreCard } from './ValidationScoreCard';
import { FindingCard } from './FindingCard';
import {
    Clock,
    Cpu,
    AlertOctagon,
    AlertTriangle,
    Info,
    Filter,
    Lightbulb,
} from 'lucide-react';

interface Finding {
    id: string;
    severity: string;
    category: string;
    title: string;
    description: string;
    affected_phase: string;
    recommendation: string;
    confidence: number;
    reasoning: string;
}

interface Report {
    id: string;
    project_id: string;
    overall_score: number;
    feasibility_score: number;
    completeness_score: number;
    consistency_score: number;
    risk_score: number;
    findings: Finding[];
    recommendations: string[];
    phases_reviewed: string[];
    model_used: string;
    tokens_used: number;
    duration_ms: number;
    created_at: string;
    created_by: string;
    status: string;
}

interface ValidationReportProps {
    report: Report;
    onFeedback?: (findingId: string, helpful: boolean) => void;
}

type SeverityFilter = 'all' | 'critical' | 'warning' | 'info';

export const ValidationReport: React.FC<ValidationReportProps> = ({ report, onFeedback }) => {
    const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const criticalCount = report.findings.filter(f => f.severity === 'critical').length;
    const warningCount = report.findings.filter(f => f.severity === 'warning').length;
    const infoCount = report.findings.filter(f => f.severity === 'info').length;

    const filteredFindings = report.findings.filter(f => {
        if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
        if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
        return true;
    });

    const durationSec = (report.duration_ms / 1000).toFixed(1);

    return (
        <div className="space-y-6">
            {/* Overall Score Hero */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold opacity-80">Plan Health Score</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-5xl font-bold">{Math.round(report.overall_score)}</span>
                            <span className="text-xl opacity-50">/100</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                            <Clock className="w-4 h-4" />
                            <span>{durationSec}s</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                            <Cpu className="w-4 h-4" />
                            <span>{report.model_used}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                            <span>{report.phases_reviewed.length} phases</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dimension Scores Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ValidationScoreCard label="Feasibility" score={report.feasibility_score} category="feasibility" />
                <ValidationScoreCard label="Completeness" score={report.completeness_score} category="completeness" />
                <ValidationScoreCard label="Consistency" score={report.consistency_score} category="consistency" />
                <ValidationScoreCard label="Risk Assessment" score={report.risk_score} category="risk" />
            </div>

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        <h3 className="text-lg font-semibold text-slate-900">Recommendations</h3>
                    </div>
                    <ul className="space-y-2">
                        {report.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm text-slate-700 leading-relaxed pl-2 border-l-2 border-amber-300">
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Findings */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                        Findings ({report.findings.length})
                    </h3>

                    {/* Severity summary badges */}
                    <div className="flex items-center gap-2">
                        {criticalCount > 0 && (
                            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">
                                <AlertOctagon className="w-3 h-3" /> {criticalCount}
                            </span>
                        )}
                        {warningCount > 0 && (
                            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                                <AlertTriangle className="w-3 h-3" /> {warningCount}
                            </span>
                        )}
                        {infoCount > 0 && (
                            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                <Info className="w-3 h-3" /> {infoCount}
                            </span>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <div className="flex items-center gap-1 text-xs text-slate-500 mr-1">
                        <Filter className="w-3 h-3" />
                        Severity:
                    </div>
                    {(['all', 'critical', 'warning', 'info'] as SeverityFilter[]).map(s => (
                        <button
                            key={s}
                            onClick={() => setSeverityFilter(s)}
                            className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${severityFilter === s
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}

                    <span className="mx-2 text-slate-300">|</span>

                    <div className="flex items-center gap-1 text-xs text-slate-500 mr-1">
                        Category:
                    </div>
                    {['all', 'feasibility', 'completeness', 'consistency', 'risk'].map(c => (
                        <button
                            key={c}
                            onClick={() => setCategoryFilter(c)}
                            className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${categoryFilter === c
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Finding cards */}
                <div className="space-y-3">
                    {filteredFindings.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                            No findings match the current filters.
                        </p>
                    ) : (
                        filteredFindings.map(finding => (
                            <FindingCard
                                key={finding.id}
                                finding={finding}
                                onFeedback={onFeedback}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ValidationReport;
