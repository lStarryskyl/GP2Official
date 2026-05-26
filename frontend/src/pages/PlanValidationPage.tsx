import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ValidationReport } from '@/components/ValidationReport';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import {
    ArrowLeft,
    Loader2,
    ShieldCheck,
    RefreshCw,
    History,
    AlertCircle,
    Sparkles,
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

type Tab = 'current' | 'history';

export const PlanValidationPage: React.FC = () => {
    const { id: projectId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<Tab>('current');
    const [reports, setReports] = useState<Report[]>([]);
    const [currentReport, setCurrentReport] = useState<Report | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [projectName, setProjectName] = useState('');

    const loadReports = useCallback(async () => {
        if (!projectId) return;
        try {
            setIsLoading(true);
            // Load project name
            try {
                const project = await api.getProject(projectId);
                setProjectName(project.name || 'Project');
            } catch { /* ignore */ }

            const response = await api.getValidations(projectId);
            const loadedReports = response.reports || [];
            setReports(loadedReports);
            if (loadedReports.length > 0) {
                setCurrentReport(loadedReports[0]); // newest first
            }
        } catch (err: any) {
            console.error('Failed to load validation reports', err);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    const handleValidate = async () => {
        if (!projectId || isValidating) return;
        try {
            setIsValidating(true);
            setError(null);
            const response = await api.triggerValidation(projectId);
            if (response.report) {
                setCurrentReport(response.report);
                setReports(prev => [response.report!, ...prev]);
                setActiveTab('current');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Validation failed. Please try again.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleFeedback = async (findingId: string, helpful: boolean) => {
        if (!projectId || !currentReport) return;
        try {
            await api.submitValidationFeedback(projectId, currentReport.id, findingId, helpful);
        } catch (err) {
            console.error('Failed to submit feedback', err);
        }
    };

    const selectReport = (report: Report) => {
        setCurrentReport(report);
        setActiveTab('current');
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-600" />
                    <div className="p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <button
                                onClick={() => navigate(`/projects/${projectId}`)}
                                className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to {projectName || 'Project'}
                            </button>

                            <div className="flex items-center gap-2">
                                {/* Tab buttons */}
                                <button
                                    onClick={() => setActiveTab('current')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'current'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    Latest Report
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'history'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    <History className="w-4 h-4" />
                                    History ({reports.length})
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <ShieldCheck className="w-7 h-7 text-violet-500" />
                                    AI Plan Validation
                                </h1>
                                <p className="text-slate-500 mt-1">
                                    Validate your project plan with AI-powered architecture review
                                </p>
                            </div>

                            <Button
                                onClick={handleValidate}
                                disabled={isValidating}
                                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20 px-6"
                            >
                                {isValidating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Validating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        {currentReport ? 'Re-validate Plan' : 'Validate Plan'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Validating animation */}
                {isValidating && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm text-center">
                        <div className="relative inline-flex">
                            <div className="w-16 h-16 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                            <ShieldCheck className="w-7 h-7 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mt-6">Validating Your Plan</h3>
                        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                            Running 4 AI review passes: Feasibility, Completeness, Consistency, and Risk Analysis.
                            This may take up to 60 seconds.
                        </p>
                    </div>
                )}

                {/* Current Report */}
                {activeTab === 'current' && !isValidating && (
                    <>
                        {currentReport ? (
                            <ValidationReport report={currentReport} onFeedback={handleFeedback} />
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm text-center">
                                <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Validation Report Yet</h3>
                                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                    Run your first AI plan validation to get a comprehensive review of your project's
                                    architecture, completeness, consistency, and risk profile.
                                </p>
                                <Button
                                    onClick={handleValidate}
                                    className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Run First Validation
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Validation History</h3>
                        {reports.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No validation reports yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {reports.map((report, idx) => {
                                    const isSelected = currentReport?.id === report.id;
                                    const date = new Date(report.created_at).toLocaleString();
                                    return (
                                        <button
                                            key={report.id}
                                            onClick={() => selectReport(report)}
                                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${isSelected
                                                    ? 'border-violet-300 bg-violet-50 shadow-sm'
                                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${report.overall_score >= 80
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : report.overall_score >= 60
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {Math.round(report.overall_score)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            Validation #{reports.length - idx}
                                                        </p>
                                                        <p className="text-xs text-slate-500">{date}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                        {report.findings.length} findings
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                        {report.phases_reviewed.length} phases
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default PlanValidationPage;
