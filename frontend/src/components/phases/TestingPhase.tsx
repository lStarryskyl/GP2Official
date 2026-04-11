import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Requirement } from '@/types';
import { api } from '@/lib/api';
import {
  FlaskConical,
  ShieldCheck,
  AlertTriangle,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  MinusCircle,
  FileText,
  BarChart3,
  Database,
  ChevronDown,
  ChevronUp,
  Target,
  Copy,
  Check,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TestScenario {
  scenario_id: string;
  requirement_id: string;
  requirement_title: string;
  scenario_type: string;
  title: string;
  description: string;
  preconditions: string[];
  test_steps: string[];
  expected_result: string;
  test_data: Record<string, any>[];
  priority: string;
}

interface TestDataSet {
  requirement_id: string;
  requirement_title: string;
  data_description: string;
  columns: string[];
  rows: Record<string, any>[];
  edge_cases: Record<string, any>[];
  notes: string;
}

interface CoverageEntry {
  requirement_id: string;
  requirement_title: string;
  requirement_type: string;
  priority: string;
  status: string;
  test_scenario_count: number;
  matched_scenarios: string[];
  gap_reason: string;
}

interface TestDataResult {
  scenarios: TestScenario[];
  datasets: TestDataSet[];
  summary: {
    total_scenarios: number;
    total_edge_cases: number;
    coverage_notes: string;
  };
}

interface CoverageResult {
  entries: CoverageEntry[];
  summary: {
    total_requirements: number;
    covered: number;
    partially_covered: number;
    orphaned: number;
    coverage_percentage: number;
  };
  recommendations: string[];
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface TestingPhaseProps {
  projectId: string;
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  content: string;
  requirements?: Requirement[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const scenarioTypeBadge = (type: string) => {
  switch (type) {
    case 'positive':
      return <Badge variant="success" className="flex items-center gap-1 text-[10px]"><CheckCircle2 className="h-3 w-3" /> Positive</Badge>;
    case 'negative':
      return <Badge variant="destructive" className="flex items-center gap-1 text-[10px]"><XCircle className="h-3 w-3" /> Negative</Badge>;
    case 'edge_case':
      return <Badge variant="warning" className="flex items-center gap-1 text-[10px]"><AlertTriangle className="h-3 w-3" /> Edge Case</Badge>;
    case 'boundary':
      return <Badge variant="default" className="flex items-center gap-1 text-[10px]"><Target className="h-3 w-3" /> Boundary</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px]">{type}</Badge>;
  }
};

const coverageStatusBadge = (status: string) => {
  switch (status) {
    case 'covered':
      return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Covered</Badge>;
    case 'partially_covered':
      return <Badge variant="warning" className="flex items-center gap-1"><MinusCircle className="h-3 w-3" /> Partial</Badge>;
    case 'orphaned':
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Orphaned</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const expectedBadge = (val: string) => {
  const v = (val || '').toLowerCase();
  if (v === 'pass' || v === 'success') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><CheckCircle2 className="h-3 w-3" /> PASS</span>;
  if (v === 'fail' || v === 'rejected' || v === 'error') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30"><XCircle className="h-3 w-3" /> FAIL</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30"><AlertTriangle className="h-3 w-3" /> {val}</span>;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const TestingPhase: React.FC<TestingPhaseProps> = ({
  projectId,
  requirements,
}) => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'data' | 'coverage'>('scenarios');
  const [testData, setTestData] = useState<TestDataResult | null>(null);
  const [coverageData, setCoverageData] = useState<CoverageResult | null>(null);
  const [loadingTests, setLoadingTests] = useState(false);
  const [loadingCoverage, setLoadingCoverage] = useState(false);
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const funcReqs = (requirements || []).filter(
    r => r.type === 'functional' || (r.type || '').toLowerCase().includes('functional')
  );

  // Load existing results on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await api.client.get(`/projects/${projectId}/testing/results`);
        const d = res.data;
        if (d.test_data) setTestData(d.test_data);
        if (d.coverage_audit) setCoverageData(d.coverage_audit);
      } catch {
        // no prior results
      }
    })();
  }, [projectId]);

  /* ---------- Generate test data ---------- */
  const handleGenerateTests = useCallback(async () => {
    setLoadingTests(true);
    setError(null);
    try {
      const res = await api.client.post(`/projects/${projectId}/testing/generate-test-data`, {
        include_edge_cases: true,
        include_boundary_values: true,
        max_rows_per_requirement: 10,
      });
      if (res.data?.data) {
        setTestData(res.data.data);
        setActiveTab('scenarios');
      }
    } catch (err: any) {
      console.error('Test generation failed', err);
      setError(err?.response?.data?.detail || 'Test generation failed. Make sure you have generated requirements first.');
    } finally {
      setLoadingTests(false);
    }
  }, [projectId]);

  /* ---------- Run coverage audit ---------- */
  const handleCoverageAudit = useCallback(async () => {
    setLoadingCoverage(true);
    setError(null);
    try {
      const res = await api.client.post(`/projects/${projectId}/testing/coverage-audit`, {
        include_non_functional: false,
      });
      const result = res.data?.data;
      if (result) {
        setCoverageData(result);
        setActiveTab('coverage');
      } else {
        setError('Coverage audit returned no data.');
      }
    } catch (err: any) {
      console.error('Coverage audit failed', err);
      setError(err?.response?.data?.detail || 'Coverage audit failed.');
    } finally {
      setLoadingCoverage(false);
    }
  }, [projectId]);

  /* ---------- Download JSON ---------- */
  const downloadJSON = useCallback(() => {
    if (!testData) return;
    const blob = new Blob([JSON.stringify(testData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-data-${projectId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [testData, projectId]);

  /* ---------- Download CSV (ALL datasets) ---------- */
  const downloadCSV = useCallback(() => {
    if (!testData?.datasets?.length) return;

    const allRows: string[] = [];
    // Unified columns: Requirement, Input, Expected Result, Test Type, Reason
    const header = 'Requirement,Input,Expected Result,Test Type,Reason';
    allRows.push(header);

    for (const ds of testData.datasets) {
      for (const row of ds.rows) {
        // Find the input column (first column that isn't expected_result/test_type/reason)
        const inputCol = ds.columns.find(c => !['expected_result', 'test_type', 'reason', 'expected_outcome'].includes(c)) || ds.columns[0];
        const inputVal = String(row[inputCol] ?? '');
        const expected = String(row['expected_result'] ?? row['expected_outcome'] ?? '');
        const testType = String(row['test_type'] ?? '');
        const reason = String(row['reason'] ?? '');
        allRows.push(
          [ds.requirement_title, inputVal, expected, testType, reason]
            .map(v => `"${v.replace(/"/g, '""')}"`)
            .join(',')
        );
      }
      // Include edge cases
      for (const ec of (ds.edge_cases || [])) {
        const inputCol = ds.columns.find(c => !['expected_result', 'test_type', 'reason', 'expected_outcome'].includes(c)) || ds.columns[0];
        const inputVal = String(ec[inputCol] ?? ec['input'] ?? '');
        const expected = String(ec['expected_result'] ?? '');
        const reason = String(ec['reason'] ?? '');
        allRows.push(
          [ds.requirement_title, inputVal, expected, 'edge_case', reason]
            .map(v => `"${v.replace(/"/g, '""')}"`)
            .join(',')
        );
      }
    }

    const blob = new Blob([allRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-data-${projectId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [testData, projectId]);

  const toggleScenario = (id: string) => {
    setExpandedScenarios(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  /* ---------- Stats ---------- */
  const totalScenarios = testData?.scenarios?.length ?? 0;
  const totalEdgeCases = testData?.summary?.total_edge_cases ?? 0;
  const coveragePct = coverageData?.summary?.coverage_percentage ?? 0;
  const orphanedCount = coverageData?.summary?.orphaned ?? 0;

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */
  return (
    <div className="space-y-6">
      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: FlaskConical, value: totalScenarios, label: 'Test Scenarios', color: 'blue' },
          { icon: AlertTriangle, value: totalEdgeCases, label: 'Edge Cases', color: 'amber' },
          { icon: ShieldCheck, value: `${coveragePct}%`, label: 'Coverage', color: 'green' },
          { icon: XCircle, value: orphanedCount, label: 'Orphaned Reqs', color: 'red' },
        ].map((stat, i) => (
          <div key={i} className="bg-[var(--brand-900)] border border-[var(--brand-700)]/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${
                stat.color === 'blue' ? 'bg-blue-500/20 border-blue-500/30' :
                stat.color === 'amber' ? 'bg-amber-500/20 border-amber-500/30' :
                stat.color === 'green' ? 'bg-emerald-500/20 border-emerald-500/30' :
                'bg-red-500/20 border-red-500/30'
              }`}>
                <stat.icon className={`h-5 w-5 ${
                  stat.color === 'blue' ? 'text-blue-400' :
                  stat.color === 'amber' ? 'text-amber-400' :
                  stat.color === 'green' ? 'text-emerald-400' :
                  'text-red-400'
                }`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleGenerateTests} disabled={loadingTests || funcReqs.length === 0} className="gap-2">
          {loadingTests ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          {loadingTests ? 'Generating Tests...' : 'Generate Test Data'}
        </Button>
        <Button variant="outline" onClick={handleCoverageAudit} disabled={loadingCoverage} className="gap-2">
          {loadingCoverage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {loadingCoverage ? 'Auditing...' : 'Run Coverage Audit'}
        </Button>
        {testData && (
          <>
            <Button variant="ghost" onClick={downloadJSON} className="gap-2 text-gray-400 hover:text-white">
              <Download className="h-4 w-4" /> JSON
            </Button>
            <Button variant="ghost" onClick={downloadCSV} className="gap-2 text-gray-400 hover:text-white">
              <Download className="h-4 w-4" /> CSV (All Data)
            </Button>
          </>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {funcReqs.length === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-300 text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          No functional requirements found. Generate requirements in the <strong className="ml-1">Requirements</strong> phase first.
        </div>
      )}

      {/* ── Tab Bar ── */}
      <div className="flex gap-1 bg-[var(--brand-850)] rounded-xl p-1 border border-[var(--brand-700)]/30">
        {([
          { id: 'scenarios', label: 'Test Scenarios', icon: FlaskConical },
          { id: 'data', label: 'Test Datasets', icon: Database },
          { id: 'coverage', label: 'Coverage Audit', icon: ShieldCheck },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--blue-500)]/15 text-[var(--blue-300)] border border-[var(--blue-500)]/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-[var(--brand-700)]/20 border border-transparent'
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB: Test Scenarios                                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'scenarios' && (
        <div className="bg-[var(--brand-900)] border border-[var(--brand-700)]/50 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--brand-700)]/30">
            <h3 className="font-bold text-white flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-blue-400" /> Generated Test Scenarios
            </h3>
            <p className="text-sm text-gray-500 mt-1">Each scenario shows the concrete input and expected output.</p>
          </div>
          <div className="divide-y divide-[var(--brand-700)]/30">
            {!testData?.scenarios?.length ? (
              <div className="p-10 text-center text-gray-500">
                <FlaskConical className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No test scenarios yet. Click <strong>Generate Test Data</strong> to create them.</p>
              </div>
            ) : (
              testData.scenarios.map(sc => {
                const isExpanded = expandedScenarios.has(sc.scenario_id);
                // Extract input/expected from test_data
                const inputField = sc.test_data?.[0] || {};
                const inputKeys = Object.keys(inputField).filter(k => k !== 'expected' && k !== 'reason');
                const inputLabel = inputKeys[0] || 'input';
                const inputValue = String(inputField[inputLabel] ?? '');
                const expectedValue = String(inputField['expected'] ?? '');
                const reasonValue = String(inputField['reason'] ?? '');

                return (
                  <div key={sc.scenario_id} className="hover:bg-[#152238]/30 transition-colors">
                    {/* Header row — always visible */}
                    <button className="w-full text-left p-4 flex items-center gap-3" onClick={() => toggleScenario(sc.scenario_id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-mono text-gray-500 bg-[var(--brand-700)]/40 px-1.5 py-0.5 rounded">{sc.scenario_id}</span>
                          {scenarioTypeBadge(sc.scenario_type)}
                          <span className="text-[10px] text-gray-600">Req: {sc.requirement_id}</span>
                        </div>
                        <p className="text-sm font-medium text-white">{sc.title}</p>
                        {/* Input → Expected preview */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] text-gray-500 uppercase font-semibold">Input:</span>
                          <code className="text-[11px] text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded font-mono max-w-[300px] truncate">{inputValue || '(see details)'}</code>
                          <span className="text-gray-600">→</span>
                          {expectedBadge(expectedValue)}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />}
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 bg-[#0a1420]/50 border-t border-[var(--brand-700)]/20">
                        {/* Input / Expected / Reason card */}
                        <div className="mt-3 rounded-xl border border-[var(--brand-700)]/40 overflow-hidden">
                          <div className="grid grid-cols-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-[var(--brand-800)] border-b border-[var(--brand-700)]/30">
                            <div className="px-4 py-2">Input</div>
                            <div className="px-4 py-2">Expected Output</div>
                            <div className="px-4 py-2">Reason</div>
                          </div>
                          {(sc.test_data || []).map((td, tdi) => {
                            const tdInputKeys = Object.keys(td).filter(k => k !== 'expected' && k !== 'reason');
                            const tdInputLabel = tdInputKeys[0] || 'input';
                            return (
                              <div key={tdi} className="grid grid-cols-3 border-b border-[var(--brand-700)]/20 last:border-0">
                                <div className="px-4 py-2.5">
                                  <span className="text-[10px] text-gray-500 block">{tdInputLabel}:</span>
                                  <code className="text-xs text-blue-300 font-mono break-all">{String(td[tdInputLabel] ?? '')}</code>
                                </div>
                                <div className="px-4 py-2.5 flex items-center">
                                  {expectedBadge(String(td['expected'] ?? ''))}
                                </div>
                                <div className="px-4 py-2.5">
                                  <span className="text-xs text-gray-400">{String(td['reason'] ?? '')}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Steps & Expected Result */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Test Steps</p>
                            <ol className="space-y-1">
                              {sc.test_steps.map((step, i) => (
                                <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                                  <span className="text-blue-400 font-mono text-[10px] mt-0.5 min-w-[16px]">{i + 1}.</span> {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Expected System Behavior</p>
                            <p className="text-xs text-gray-300 bg-[var(--brand-700)]/30 rounded-lg p-2">{sc.expected_result}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB: Test Datasets                                           */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'data' && (
        <div className="space-y-4">
          {!testData?.datasets?.length ? (
            <div className="bg-[var(--brand-900)] border border-[var(--brand-700)]/50 rounded-2xl p-10 text-center text-gray-500">
              <Database className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No test datasets yet. Click <strong>Generate Test Data</strong> to create them.</p>
            </div>
          ) : (
            testData.datasets.map((ds, idx) => (
              <div key={idx} className="bg-[var(--brand-900)] border border-[var(--brand-700)]/50 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[var(--brand-700)]/30 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-gray-500 bg-[var(--brand-700)]/40 px-1.5 py-0.5 rounded">{ds.requirement_id}</span>
                      <h4 className="text-sm font-semibold text-white">{ds.requirement_title}</h4>
                    </div>
                    <p className="text-xs text-gray-500">{ds.data_description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{ds.rows?.length ?? 0} rows</Badge>
                    {ds.edge_cases?.length > 0 && (
                      <Badge variant="warning" className="text-[10px]">{ds.edge_cases.length} edge cases</Badge>
                    )}
                  </div>
                </div>
                {/* Data table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--brand-700)]/30 bg-[#0a1420]/50">
                        {ds.columns.map(col => (
                          <th key={col} className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{col.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ds.rows.map((row, ri) => (
                        <tr key={ri} className={`border-b border-[var(--brand-700)]/20 hover:bg-[#152238]/30 transition-colors ${
                          String(row['expected_result'] ?? row['expected_outcome'] ?? '').toLowerCase() === 'fail' ? 'bg-red-500/5' :
                          String(row['expected_result'] ?? row['expected_outcome'] ?? '').toLowerCase() === 'pass' ? 'bg-emerald-500/5' : ''
                        }`}>
                          {ds.columns.map(col => (
                            <td key={col} className="px-4 py-2 font-mono text-[11px]">
                              {col === 'expected_result' || col === 'expected_outcome'
                                ? expectedBadge(String(row[col] ?? ''))
                                : <span className="text-gray-300">{String(row[col] ?? '-')}</span>
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Edge cases */}
                {ds.edge_cases?.length > 0 && (
                  <div className="p-4 border-t border-[var(--brand-700)]/30 bg-amber-500/5">
                    <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Edge Cases
                    </p>
                    <div className="space-y-2">
                      {ds.edge_cases.map((ec, ei) => {
                        const ecInputKey = Object.keys(ec).find(k => !['expected_result', 'reason'].includes(k)) || 'input';
                        return (
                          <div key={ei} className="flex items-center gap-3 text-xs bg-[var(--brand-900)] rounded-lg p-2 border border-amber-500/20">
                            <code className="text-amber-300 font-mono text-[11px]">{String(ec[ecInputKey] ?? '')}</code>
                            <span className="text-gray-600">→</span>
                            {expectedBadge(String(ec['expected_result'] ?? 'fail'))}
                            <span className="text-gray-500 text-[11px] ml-auto">{String(ec['reason'] ?? '')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {ds.notes && (
                  <div className="px-4 py-2 border-t border-[var(--brand-700)]/20 text-[11px] text-gray-500 italic">{ds.notes}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB: Coverage Audit                                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'coverage' && (
        <div className="space-y-4">
          {/* Coverage summary */}
          {coverageData?.summary && coverageData.summary.total_requirements > 0 && (
            <div className="bg-[var(--brand-900)] border border-[var(--brand-700)]/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-400" /> Coverage Summary
                </h3>
                <span className={`text-2xl font-bold ${
                  coverageData.summary.coverage_percentage >= 80 ? 'text-emerald-400' :
                  coverageData.summary.coverage_percentage >= 50 ? 'text-amber-400' :
                  'text-red-400'
                }`}>{coverageData.summary.coverage_percentage}%</span>
              </div>
              <div className="h-3 bg-[var(--brand-700)]/50 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    coverageData.summary.coverage_percentage >= 80 ? 'bg-emerald-500' :
                    coverageData.summary.coverage_percentage >= 50 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(coverageData.summary.coverage_percentage, 2)}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-emerald-400">{coverageData.summary.covered}</p>
                  <p className="text-[10px] text-gray-500 uppercase">Fully Covered</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-400">{coverageData.summary.partially_covered}</p>
                  <p className="text-[10px] text-gray-500 uppercase">Partially Covered</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-400">{coverageData.summary.orphaned}</p>
                  <p className="text-[10px] text-gray-500 uppercase">No Tests (Orphaned)</p>
                </div>
              </div>
            </div>
          )}

          {/* Coverage matrix table */}
          <div className="bg-[var(--brand-900)] border border-[var(--brand-700)]/50 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[var(--brand-700)]/30">
              <h3 className="font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-400" /> Requirement Coverage Matrix
              </h3>
              <p className="text-sm text-gray-500 mt-1">Each requirement mapped against its test scenarios.</p>
            </div>
            {!coverageData?.entries?.length ? (
              <div className="p-10 text-center text-gray-500">
                <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No coverage audit yet. Click <strong>Run Coverage Audit</strong> to analyze gaps.</p>
                {!testData?.scenarios?.length && (
                  <p className="text-xs text-gray-600 mt-2">Tip: Generate test data first, then run the audit to see which requirements are covered.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--brand-700)]/30 bg-[#0a1420]/50">
                      <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Requirement</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Priority</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Coverage</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tests</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Gap / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverageData.entries.map((entry, i) => (
                      <tr key={i} className={`border-b border-[var(--brand-700)]/20 transition-colors ${
                        entry.status === 'orphaned' ? 'bg-red-500/5 hover:bg-red-500/10' :
                        entry.status === 'partially_covered' ? 'bg-amber-500/5 hover:bg-amber-500/10' :
                        'bg-emerald-500/5 hover:bg-emerald-500/8'
                      }`}>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-mono text-gray-500 block">{entry.requirement_id}</span>
                          <p className="text-sm text-white">{entry.requirement_title}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={entry.priority === 'high' || entry.priority === 'critical' ? 'warning' : 'secondary'} className="text-[10px]">
                            {entry.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{coverageStatusBadge(entry.status)}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-center">{entry.test_scenario_count}</td>
                        <td className="px-4 py-3 text-gray-500 text-[11px] max-w-[300px]">{entry.gap_reason || 'All test types covered.'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {coverageData?.recommendations && coverageData.recommendations.length > 0 && (
            <div className="bg-[var(--brand-900)] border border-[var(--brand-700)]/50 rounded-2xl p-5">
              <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-[var(--blue-400)]" /> Recommendations
              </h3>
              <div className="space-y-2">
                {coverageData.recommendations.map((rec, i) => (
                  <div key={i} className={`flex items-start gap-2 text-sm rounded-lg p-2 ${
                    rec.startsWith('[CRITICAL]') ? 'bg-red-500/10 text-red-300 border border-red-500/20' :
                    rec.startsWith('[HIGH]') ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                    'text-gray-300'
                  }`}>
                    <span className="text-[var(--blue-400)] mt-0.5 flex-shrink-0">→</span>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
