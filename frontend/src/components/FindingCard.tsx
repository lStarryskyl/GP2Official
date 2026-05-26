import React, { useState } from 'react';
import {
    AlertOctagon,
    AlertTriangle,
    Info,
    ChevronDown,
    ChevronUp,
    ThumbsUp,
    ThumbsDown,
    Layers,
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

interface FindingCardProps {
    finding: Finding;
    onFeedback?: (findingId: string, helpful: boolean) => void;
}

const severityConfig: Record<string, { icon: React.FC<{ className?: string }>; bg: string; border: string; badge: string; label: string }> = {
    critical: {
        icon: AlertOctagon,
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-700',
        label: 'Critical',
    },
    warning: {
        icon: AlertTriangle,
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-700',
        label: 'Warning',
    },
    info: {
        icon: Info,
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-700',
        label: 'Info',
    },
};

const categoryLabels: Record<string, string> = {
    feasibility: 'Feasibility',
    completeness: 'Completeness',
    consistency: 'Consistency',
    risk: 'Risk',
};

export const FindingCard: React.FC<FindingCardProps> = ({ finding, onFeedback }) => {
    const [expanded, setExpanded] = useState(false);
    const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);

    const config = severityConfig[finding.severity] || severityConfig.info;
    const Icon = config.icon;

    const handleFeedback = (helpful: boolean) => {
        setFeedbackGiven(helpful);
        onFeedback?.(finding.id, helpful);
    };

    return (
        <div className={`rounded-xl border ${config.border} ${config.bg} transition-all`}>
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-start gap-3 p-4 text-left"
            >
                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0 text-current opacity-70" />
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
                            {config.label}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {categoryLabels[finding.category] || finding.category}
                        </span>
                        {finding.affected_phase && finding.affected_phase !== 'general' && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                {finding.affected_phase}
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{finding.title}</p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{finding.description}</p>
                </div>
                <div className="flex-shrink-0 text-slate-400">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </button>

            {/* Expanded details */}
            {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-dashed border-current/10">
                    <div className="pt-3">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Recommendation
                        </h4>
                        <p className="text-sm text-slate-700">{finding.recommendation}</p>
                    </div>

                    {finding.reasoning && (
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                AI Reasoning
                            </h4>
                            <p className="text-sm text-slate-600 italic">{finding.reasoning}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-slate-500">
                            Confidence: {Math.round(finding.confidence * 100)}%
                        </span>
                        {onFeedback && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Helpful?</span>
                                <button
                                    onClick={() => handleFeedback(true)}
                                    disabled={feedbackGiven !== null}
                                    className={`p-1.5 rounded-lg transition-all ${feedbackGiven === true
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : feedbackGiven !== null
                                                ? 'opacity-30 cursor-not-allowed'
                                                : 'hover:bg-emerald-100 text-slate-400 hover:text-emerald-600'
                                        }`}
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleFeedback(false)}
                                    disabled={feedbackGiven !== null}
                                    className={`p-1.5 rounded-lg transition-all ${feedbackGiven === false
                                            ? 'bg-red-100 text-red-600'
                                            : feedbackGiven !== null
                                                ? 'opacity-30 cursor-not-allowed'
                                                : 'hover:bg-red-100 text-slate-400 hover:text-red-600'
                                        }`}
                                >
                                    <ThumbsDown className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FindingCard;
