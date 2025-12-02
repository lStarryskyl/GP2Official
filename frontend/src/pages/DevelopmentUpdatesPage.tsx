import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import type { Project, Task, Requirement, ChangeLogEntry, ChangeLogFileDetail } from '@/types';
import { Loader2, ArrowLeft, Upload, FileCode, ListChecks, GitMerge, UploadCloud } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const DevelopmentUpdatesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [entries, setEntries] = useState<ChangeLogEntry[]>([]);
  const [description, setDescription] = useState('');
  const [filesText, setFilesText] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generateDiagramManual, setGenerateDiagramManual] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTasks, setUploadTasks] = useState<string[]>([]);
  const [uploadRequirements, setUploadRequirements] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generateDiagramUpload, setGenerateDiagramUpload] = useState(false);
  const [autoVisualize, setAutoVisualize] = useState(() => localStorage.getItem('dev_updates_auto_diagram') === 'true');
  const latestDiagramEntry = entries.find((entry) => entry.diagram_url);
  type FileDisplay = { name: string; timestamp?: string };

  const formatFilesForEntry = (entry: ChangeLogEntry): FileDisplay[] => {
    const details = (entry.metadata?.file_details as ChangeLogFileDetail[] | undefined) || [];
    if (details.length > 0) {
      return details.map((detail) => ({
        name: detail.name,
        timestamp: detail.timestamp,
      }));
    }
    return entry.files.map((name) => ({ name }));
  };
  const manualFilesList = filesText
    .split(/\n|,/)
    .map((file) => file.trim())
    .filter(Boolean);
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [proj, taskList, reqList, changelog] = await Promise.all([
        api.getProject(id),
        api.getTasks(id),
        api.getRequirements(id),
        api.getChangeLog(id),
      ]);
      setProject(proj);
      setTasks(taskList);
      setRequirements(reqList);
      setEntries(changelog);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load updates.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    setGenerateDiagramManual(autoVisualize);
    setGenerateDiagramUpload(autoVisualize);
    localStorage.setItem('dev_updates_auto_diagram', autoVisualize ? 'true' : 'false');
  }, [autoVisualize]);

  const handleSubmit = async () => {
    if (!id || !description.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        description: description.trim(),
        files: manualFilesList,
        task_ids: selectedTasks,
        requirement_ids: selectedRequirements,
        entry_type: 'manual',
        generate_diagram: generateDiagramManual,
      };
      await api.createChangeLog(id, payload);
      setDescription('');
      setFilesText('');
      setSelectedTasks([]);
      setSelectedRequirements([]);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to save update.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    if (!id || !uploadFile) return;
    setUploading(true);
    setError(null);
    try {
      await api.uploadChangeLog(id, {
        file: uploadFile,
        description: uploadDescription,
        task_ids: uploadTasks,
        requirement_ids: uploadRequirements,
        generate_diagram: generateDiagramUpload,
      });
      setUploadFile(null);
      setUploadDescription('');
      setUploadTasks([]);
      setUploadRequirements([]);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const toggleEntry = (entryId: string) => {
    setExpandedEntries((prev) => ({ ...prev, [entryId]: !prev[entryId] }));
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-16 space-y-4">
          <p className="text-gray-600">Project not found.</p>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-[#F9FAFB] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate(`/projects/${project.project_id || project.id}`)}
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Project
            </button>
            <span className="text-sm text-gray-500">
              Last updated {project.updated_at ? new Date(project.updated_at).toLocaleString() : 'n/a'}
            </span>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-2">
            <p className="text-xs uppercase tracking-wide text-[#6B7280]">Operations</p>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-[#111827]">Development Updates</h1>
                <p className="text-sm text-[#4B5563]">
                  Track progress, attach code, and keep the team aligned on what&apos;s shipped.
                </p>
              </div>
              <Badge variant="outline" className="text-xs text-[#4B5563] border-[#E5E7EB] bg-white">
                {project.name}
              </Badge>
            </div>
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">Manual Development Update</h2>
                <p className="text-sm text-[#6B7280]">Share the story behind the work, link it to planned tasks, and flag diagram needs.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#6B7280]">What changed?</label>
                  <textarea
                    className="w-full border border-[#E5E7EB] rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-[#4F46E5] focus:outline-none min-h-[140px]"
                    placeholder="Added retry logic to payment service, updated API contract..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#6B7280]">Files touched</label>
                  <textarea
                    className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-[#4F46E5] focus:outline-none"
                    rows={3}
                    placeholder="src/api.ts, backend/services/foo.py or one per line"
                    value={filesText}
                    onChange={(e) => setFilesText(e.target.value)}
                  />
                  {manualFilesList.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {manualFilesList.map((file, idx) => (
                        <span
                          key={`manual-${idx}-${file || 'file'}`}
                          className="inline-flex items-center rounded-full border border-[#E5E7EB] px-3 py-1 text-xs text-[#4B5563] bg-[#F9FAFB]"
                        >
                          <FileCode className="h-3.5 w-3.5 mr-1 text-[#9CA3AF]" />
                          {file}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#6B7280]">Linked tasks</label>
                    <select
                      multiple
                      value={selectedTasks}
                      onChange={(e) => setSelectedTasks(Array.from(e.target.selectedOptions, (opt) => opt.value))}
                      className="w-full border border-[#E5E7EB] rounded-xl px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] h-32"
                    >
                      {tasks.map((task) => (
                        <option key={task.task_id} value={task.task_id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#6B7280]">Linked requirements</label>
                    <select
                      multiple
                      value={selectedRequirements}
                      onChange={(e) => setSelectedRequirements(Array.from(e.target.selectedOptions, (opt) => opt.value))}
                      className="w-full border border-[#E5E7EB] rounded-xl px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] h-32"
                    >
                      {requirements.map((req) => (
                        <option key={req.requirement_id} value={req.requirement_id}>
                          {req.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-[#4B5563]">
                    <input
                      type="checkbox"
                      checked={generateDiagramManual}
                      onChange={(e) => setGenerateDiagramManual(e.target.checked)}
                    />
                    Generate user flow diagram from this update
                  </label>
                  <Button onClick={handleSubmit} disabled={saving || !description.trim()} className="bg-[#4F46E5] hover:bg-[#4338CA]">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4 mr-2" />Log Update</>}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">Upload Code or Snippet</h2>
                <p className="text-sm text-[#6B7280]">Drop a file or archive. We&apos;ll summarize it and connect it to the plan.</p>
              </div>
              <label className="border border-dashed border-[#D1D5DB] rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center gap-2 bg-[#F9FAFB]">
                <UploadCloud className="h-8 w-8 text-[#4F46E5]" />
                <div className="text-sm text-[#4B5563]">
                  Drag &amp; drop or <span className="text-[#4F46E5] font-medium">browse files</span>
                </div>
                <p className="text-xs text-[#6B7280]">ZIP, txt, code files. Max 10 MB.</p>
                <input
                  type="file"
                  accept=".zip,.txt,.md,.py,.js,.ts,.tsx,.json,.php,.java,.rb,.go,.rs,.cs"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
                {uploadFile && <p className="text-xs text-[#4B5563] mt-2">{uploadFile.name}</p>}
              </label>
              <textarea
                className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-[#4F46E5] focus:outline-none"
                rows={3}
                placeholder="Optional notes for the AI"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
              <div className="grid gap-4 text-sm">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#6B7280]">Linked tasks</label>
                  <select
                    multiple
                    value={uploadTasks}
                    onChange={(e) => setUploadTasks(Array.from(e.target.selectedOptions, (opt) => opt.value))}
                    className="w-full border border-[#E5E7EB] rounded-xl px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] h-28"
                  >
                    {tasks.map((task) => (
                      <option key={task.task_id} value={task.task_id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#6B7280]">Linked requirements</label>
                  <select
                    multiple
                    value={uploadRequirements}
                    onChange={(e) => setUploadRequirements(Array.from(e.target.selectedOptions, (opt) => opt.value))}
                    className="w-full border border-[#E5E7EB] rounded-xl px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] h-28"
                  >
                    {requirements.map((req) => (
                      <option key={req.requirement_id} value={req.requirement_id}>
                        {req.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-[#4B5563]">
                  <input
                    type="checkbox"
                    checked={generateDiagramUpload}
                    onChange={(e) => setGenerateDiagramUpload(e.target.checked)}
                  />
                  Generate user flow diagram
                </label>
                <Button onClick={handleUpload} disabled={uploading || !uploadFile} className="bg-[#4F46E5] hover:bg-[#4338CA]">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4 mr-2" />Upload &amp; Analyze</>}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">User Flow Illustration</h2>
                <p className="text-sm text-[#6B7280]">AI renders the latest system flow whenever diagrams are enabled.</p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-[#4B5563]">
                <input
                  type="checkbox"
                  checked={autoVisualize}
                  onChange={(e) => setAutoVisualize(e.target.checked)}
                />
                Auto visualization
              </label>
            </div>
            {latestDiagramEntry?.diagram_url ? (
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] overflow-hidden">
                <img src={latestDiagramEntry.diagram_url} alt="User flow diagram" className="w-full object-contain max-h-[360px]" />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] p-10 text-center">
                <p className="text-sm text-[#6B7280]">AI will generate diagrams here after each update when visualization is enabled.</p>
              </div>
            )}
            {latestDiagramEntry && (
              <p className="text-xs text-[#6B7280]">
                Generated {new Date(latestDiagramEntry.created_at).toLocaleString()} from “{latestDiagramEntry.description.slice(0, 48)}{latestDiagramEntry.description.length > 48 ? '…' : ''}”.
              </p>
            )}
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">Recent Progress</h2>
                <p className="text-sm text-[#6B7280]">Chronological audit trail of shipped work.</p>
              </div>
            </div>
            {entries.length === 0 ? (
              <p className="text-sm text-[#6B7280]">No updates yet. Log the first one above.</p>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => {
                  const isOpen = expandedEntries[entry.id];
                  return (
                    <div key={entry.id} className="border border-[#E5E7EB] rounded-2xl p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs text-[#6B7280]">
                          <span className="font-semibold text-[#111827]">{entry.metadata?.author_name || entry.author_id}</span>
                          <span className="mx-2 text-[#D1D5DB]">•</span>
                          {new Date(entry.created_at).toLocaleString()}
                        </div>
                        <Badge variant="outline" className="text-xs capitalize border-[#E5E7EB]">
                          {entry.entry_type}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-[#111827]">{entry.description}</p>
                          {entry.ai_summary && (
                            <div className="mt-1 text-sm text-[#4B5563] bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-xl p-3">
                              <ReactMarkdown>{entry.ai_summary}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" onClick={() => toggleEntry(entry.id)} className="text-sm text-[#4F46E5]">
                          {isOpen ? 'Hide details' : 'View details'}
                        </Button>
                      </div>
                      {isOpen && (
                        <div className="space-y-3 border-t border-[#F3F4F6] pt-3">
                          {entry.metadata?.snippet_preview && (
                            <div>
                              <p className="text-xs uppercase text-[#9CA3AF] mb-1">Code</p>
                              <pre className="text-sm text-[#111827] bg-[#F3F4F6] rounded-xl p-3 overflow-x-auto">
                                {entry.metadata.snippet_preview}
                              </pre>
                            </div>
                          )}
                          {entry.files.length > 0 && (
                            <div className="flex flex-wrap gap-2 text-xs text-[#4B5563]">
                              {formatFilesForEntry(entry).map((detail, idx) => (
                                <span
                                  key={`${entry.id}-detail-${idx}-${detail.name || 'file'}`}
                                  className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] px-3 py-1"
                                  title={detail.timestamp ? `Touched at ${new Date(detail.timestamp).toLocaleString()}` : undefined}
                                >
                                  <FileCode className="h-3.5 w-3.5" /> {detail.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {(entry.task_ids.length > 0 || entry.requirement_ids.length > 0) && (
                            <div className="flex flex-wrap gap-4 text-xs text-[#4B5563]">
                              {entry.task_ids.length > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <ListChecks className="h-3.5 w-3.5 text-[#9CA3AF]" />
                                  {entry.task_ids.join(', ')}
                                </span>
                              )}
                              {entry.requirement_ids.length > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <GitMerge className="h-3.5 w-3.5 text-[#9CA3AF]" />
                                  {entry.requirement_ids.join(', ')}
                                </span>
                              )}
                            </div>
                          )}
                          {entry.diagram_url && (
                            <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                              <img src={entry.diagram_url} alt="Diagram" className="w-full max-h-60 object-contain" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DevelopmentUpdatesPage;
