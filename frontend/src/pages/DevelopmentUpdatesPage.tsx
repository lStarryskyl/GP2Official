import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import type { Project, Task, Requirement, ChangeLogEntry, ChangeLogFileDetail } from '@/types';
import {
  Loader2, ArrowLeft, Upload, FileCode, ListChecks,
  GitMerge, UploadCloud, ChevronDown, ChevronUp,
  GitCommitHorizontal, Sparkles, Image, Eye, EyeOff,
  Activity, Clock,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, children }) => (
  <div style={{
    background: 'var(--brand-850)',
    border: '1px solid rgba(30,53,82,0.7)',
    borderRadius: 20, overflow: 'hidden',
  }}>
    <div style={{
      padding: '20px 24px 16px',
      borderBottom: '1px solid rgba(30,53,82,0.5)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: 'rgba(26,111,212,0.12)', border: '1px solid rgba(26,111,212,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>
      </div>
    </div>
    <div style={{ padding: '20px 24px' }}>{children}</div>
  </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px',
  }}>
    {children}
  </p>
);

const DarkTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ style, ...props }) => (
  <textarea
    style={{
      width: '100%', boxSizing: 'border-box',
      background: 'var(--brand-800)', border: '1px solid rgba(30,53,82,0.8)',
      borderRadius: 10, padding: '10px 12px',
      fontSize: 13, color: 'var(--text-primary)',
      outline: 'none', resize: 'vertical', fontFamily: 'inherit',
      ...style,
    }}
    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(26,111,212,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,111,212,0.1)'; }}
    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(30,53,82,0.8)'; e.currentTarget.style.boxShadow = 'none'; }}
    {...props}
  />
);

const DarkSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ style, children, ...props }) => (
  <select
    style={{
      width: '100%', boxSizing: 'border-box',
      background: 'var(--brand-800)', border: '1px solid rgba(30,53,82,0.8)',
      borderRadius: 10, padding: '9px 12px',
      fontSize: 13, color: 'var(--text-primary)',
      outline: 'none', cursor: 'pointer',
      ...style,
    }}
    {...props}
  >
    {children}
  </select>
);

const PrimaryBtn: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ onClick, disabled, loading, icon, children }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      background: disabled || loading
        ? 'rgba(26,111,212,0.2)'
        : 'linear-gradient(135deg, var(--blue-500), var(--blue-700))',
      border: '1px solid rgba(26,111,212,0.4)',
      borderRadius: 10, padding: '9px 20px',
      fontSize: 13, fontWeight: 600, color: '#fff',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s', whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,111,212,0.35)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
  >
    {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : icon}
    {children}
  </button>
);

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
  const [generateDiagramManual, setGenerateDiagramManual] = useState(false);
  const [saving, setSaving] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTasks, setUploadTasks] = useState<string[]>([]);
  const [uploadRequirements, setUploadRequirements] = useState<string[]>([]);
  const [generateDiagramUpload, setGenerateDiagramUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});
  const [autoVisualize, setAutoVisualize] = useState(
    () => localStorage.getItem('dev_updates_auto_diagram') === 'true'
  );

  const latestDiagramEntry = entries.find(e => e.diagram_url);

  type FileDisplay = { name: string; timestamp?: string };
  const formatFilesForEntry = (entry: ChangeLogEntry): FileDisplay[] => {
    const details = (entry.metadata?.file_details as ChangeLogFileDetail[] | undefined) || [];
    if (details.length > 0) return details.map(d => ({ name: d.name, timestamp: d.timestamp }));
    return entry.files.map(name => ({ name }));
  };

  const manualFilesList = filesText.split(/\n|,/).map(f => f.trim()).filter(Boolean);

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

  useEffect(() => { loadData(); }, [id]);

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
      await api.createChangeLog(id, {
        description: description.trim(),
        files: manualFilesList,
        task_ids: selectedTasks,
        requirement_ids: selectedRequirements,
        entry_type: 'manual',
        generate_diagram: generateDiagramManual,
      });
      setDescription(''); setFilesText('');
      setSelectedTasks([]); setSelectedRequirements([]);
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
      setUploadFile(null); setUploadDescription('');
      setUploadTasks([]); setUploadRequirements([]);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const toggleEntry = (entryId: string) =>
    setExpandedEntries(prev => ({ ...prev, [entryId]: !prev[entryId] }));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadFile(file);
  };

  if (isLoading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
          <Loader2 style={{ width: 32, height: 32, color: 'var(--blue-400)', animation: 'spin 1s linear infinite' }} />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Project not found.</p>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </Layout>
    );
  }

  const projectId = project.project_id || project.id;

  return (
    <Layout>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
              padding: '6px 10px', borderRadius: 8, transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <ArrowLeft size={15} /> Back to Project
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            Last updated {project.updated_at ? new Date(project.updated_at).toLocaleString() : 'n/a'}
          </span>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, var(--brand-800) 0%, var(--brand-850) 100%)',
          border: '1px solid rgba(26,111,212,0.2)',
          borderRadius: 20, padding: '28px 32px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8,
                background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
                borderRadius: 6, padding: '3px 10px',
                fontSize: 10, fontWeight: 700, color: '#F97316',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                <Activity size={10} /> Operations
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                Development Updates
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Track progress, attach code, and keep the team aligned on what's shipped.
              </p>
            </div>
            <div style={{
              background: 'rgba(26,46,69,0.6)', border: '1px solid rgba(30,53,82,0.6)',
              borderRadius: 10, padding: '6px 14px',
              fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            }}>
              {project.name}
            </div>
          </div>
          {error && (
            <div style={{
              marginTop: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171',
            }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>

          <SectionCard
            icon={<GitCommitHorizontal size={18} color="#3d8fe0" />}
            title="Manual Development Update"
            subtitle="Share the story behind the work, link it to planned tasks, and flag diagram needs."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <FieldLabel>What changed?</FieldLabel>
                <DarkTextarea
                  rows={5}
                  placeholder="Added retry logic to payment service, updated API contract..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Files touched</FieldLabel>
                <DarkTextarea
                  rows={3}
                  placeholder="src/api.ts, backend/services/foo.py or one per line"
                  value={filesText}
                  onChange={e => setFilesText(e.target.value)}
                />
                {manualFilesList.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {manualFilesList.map((file, idx) => (
                      <span
                        key={`f-${idx}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: 'rgba(26,111,212,0.1)', border: '1px solid rgba(26,111,212,0.25)',
                          borderRadius: 20, padding: '3px 10px',
                          fontSize: 11, color: '#70b3ee',
                        }}
                      >
                        <FileCode size={11} /> {file}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <FieldLabel>Linked tasks</FieldLabel>
                  <DarkSelect
                    multiple
                    value={selectedTasks}
                    onChange={e => setSelectedTasks(Array.from(e.target.selectedOptions, o => o.value))}
                    style={{ height: 120 }}
                  >
                    {tasks.map(t => <option key={t.task_id} value={t.task_id}>{t.title}</option>)}
                  </DarkSelect>
                </div>
                <div>
                  <FieldLabel>Linked requirements</FieldLabel>
                  <DarkSelect
                    multiple
                    value={selectedRequirements}
                    onChange={e => setSelectedRequirements(Array.from(e.target.selectedOptions, o => o.value))}
                    style={{ height: 120 }}
                  >
                    {requirements.map(r => <option key={r.requirement_id} value={r.requirement_id}>{r.title}</option>)}
                  </DarkSelect>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={generateDiagramManual}
                    onChange={e => setGenerateDiagramManual(e.target.checked)}
                    style={{ accentColor: '#1A6FD4' }}
                  />
                  Generate user flow diagram from this update
                </label>
                <PrimaryBtn
                  onClick={handleSubmit}
                  disabled={!description.trim()}
                  loading={saving}
                  icon={<Upload size={14} />}
                >
                  Log Update
                </PrimaryBtn>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={<UploadCloud size={18} color="#F97316" />}
            title="Upload Code or Snippet"
            subtitle="Drop a file or archive. We'll summarize it and connect it to the plan."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                  background: dragOver
                    ? 'rgba(249,115,22,0.08)'
                    : uploadFile ? 'rgba(26,111,212,0.06)' : 'var(--brand-800)',
                  border: `2px dashed ${dragOver ? 'rgba(249,115,22,0.5)' : uploadFile ? 'rgba(26,111,212,0.4)' : 'rgba(30,53,82,0.8)'}`,
                  borderRadius: 14, padding: '28px 20px',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <UploadCloud size={22} color="#F97316" />
                </div>
                {uploadFile ? (
                  <>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      {uploadFile.name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                      {(uploadFile.size / 1024).toFixed(1)} KB · Click to replace
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                      Drag & drop or{' '}
                      <span style={{ color: '#F97316', fontWeight: 600 }}>browse files</span>
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: 0 }}>
                      ZIP, txt, code files. Max 10 MB.
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept=".zip,.txt,.md,.py,.js,.ts,.tsx,.json,.php,.java,.rb,.go,.rs,.cs"
                  className="hidden"
                  style={{ display: 'none' }}
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                />
              </label>

              <div>
                <FieldLabel>Optional notes for the AI</FieldLabel>
                <DarkTextarea
                  rows={2}
                  placeholder="E.g. This refactor removes the legacy auth module..."
                  value={uploadDescription}
                  onChange={e => setUploadDescription(e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Linked tasks</FieldLabel>
                <DarkSelect
                  multiple
                  value={uploadTasks}
                  onChange={e => setUploadTasks(Array.from(e.target.selectedOptions, o => o.value))}
                  style={{ height: 100 }}
                >
                  {tasks.map(t => <option key={t.task_id} value={t.task_id}>{t.title}</option>)}
                </DarkSelect>
              </div>
              <div>
                <FieldLabel>Linked requirements</FieldLabel>
                <DarkSelect
                  multiple
                  value={uploadRequirements}
                  onChange={e => setUploadRequirements(Array.from(e.target.selectedOptions, o => o.value))}
                  style={{ height: 100 }}
                >
                  {requirements.map(r => <option key={r.requirement_id} value={r.requirement_id}>{r.title}</option>)}
                </DarkSelect>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={generateDiagramUpload}
                    onChange={e => setGenerateDiagramUpload(e.target.checked)}
                    style={{ accentColor: '#1A6FD4' }}
                  />
                  Generate user flow diagram
                </label>
                <PrimaryBtn
                  onClick={handleUpload}
                  disabled={!uploadFile}
                  loading={uploading}
                  icon={<Upload size={14} />}
                >
                  Upload & Analyze
                </PrimaryBtn>
              </div>
            </div>
          </SectionCard>
        </div>

        <div style={{
          background: 'var(--brand-850)', border: '1px solid rgba(30,53,82,0.7)',
          borderRadius: 20, overflow: 'hidden',
        }}>
          <div style={{
            padding: '18px 24px 14px', borderBottom: '1px solid rgba(30,53,82,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Image size={18} color="#0EA5E9" />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  User Flow Illustration
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  AI renders the latest system flow whenever diagrams are enabled.
                </p>
              </div>
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoVisualize}
                onChange={e => setAutoVisualize(e.target.checked)}
                style={{ accentColor: '#1A6FD4' }}
              />
              Auto visualization
            </label>
          </div>
          <div style={{ padding: '20px 24px' }}>
            {latestDiagramEntry?.diagram_url ? (
              <div style={{ borderRadius: 14, border: '1px solid rgba(30,53,82,0.6)', overflow: 'hidden', background: 'var(--brand-800)' }}>
                <img src={latestDiagramEntry.diagram_url} alt="User flow diagram" style={{ width: '100%', objectFit: 'contain', maxHeight: 360 }} />
              </div>
            ) : (
              <div style={{
                border: '2px dashed rgba(30,53,82,0.6)', borderRadius: 14,
                padding: '48px 24px', textAlign: 'center',
                background: 'var(--brand-800)',
              }}>
                <Sparkles size={28} color="var(--text-faint)" style={{ marginBottom: 10 }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  AI will generate diagrams here after each update when visualization is enabled.
                </p>
              </div>
            )}
            {latestDiagramEntry && (
              <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 10 }}>
                Generated {new Date(latestDiagramEntry.created_at).toLocaleString()} from "
                {latestDiagramEntry.description.slice(0, 60)}{latestDiagramEntry.description.length > 60 ? '…' : ''}".
              </p>
            )}
          </div>
        </div>

        <div style={{
          background: 'var(--brand-850)', border: '1px solid rgba(30,53,82,0.7)',
          borderRadius: 20, overflow: 'hidden',
        }}>
          <div style={{
            padding: '18px 24px 14px', borderBottom: '1px solid rgba(30,53,82,0.5)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(42,157,143,0.1)', border: '1px solid rgba(42,157,143,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Clock size={18} color="#2A9D8F" />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Recent Progress
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Chronological audit trail of shipped work.
              </p>
            </div>
            {entries.length > 0 && (
              <div style={{
                marginLeft: 'auto',
                background: 'rgba(42,157,143,0.12)', border: '1px solid rgba(42,157,143,0.3)',
                borderRadius: 20, padding: '3px 12px',
                fontSize: 12, fontWeight: 600, color: '#2A9D8F',
              }}>
                {entries.length} entries
              </div>
            )}
          </div>
          <div style={{ padding: '20px 24px' }}>
            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <GitCommitHorizontal size={28} color="var(--text-faint)" style={{ marginBottom: 10 }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  No updates yet. Log the first one above.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {entries.map(entry => {
                  const isOpen = expandedEntries[entry.id];
                  const typeColors: Record<string, { bg: string; text: string; border: string }> = {
                    manual: { bg: 'rgba(26,111,212,0.1)', text: '#3d8fe0', border: 'rgba(26,111,212,0.3)' },
                    upload: { bg: 'rgba(249,115,22,0.1)', text: '#F97316', border: 'rgba(249,115,22,0.3)' },
                    ai: { bg: 'rgba(139,92,246,0.1)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
                  };
                  const tc = typeColors[entry.entry_type] || typeColors.manual;

                  return (
                    <div
                      key={entry.id}
                      style={{
                        background: 'var(--brand-800)', border: '1px solid rgba(30,53,82,0.6)',
                        borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s',
                      }}
                    >
                      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                          background: tc.bg, border: `1px solid ${tc.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <GitCommitHorizontal size={14} color={tc.text} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {entry.metadata?.author_name || entry.author_id}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                                {new Date(entry.created_at).toLocaleString()}
                              </span>
                              <span style={{
                                background: tc.bg, border: `1px solid ${tc.border}`,
                                borderRadius: 20, padding: '2px 8px',
                                fontSize: 10, fontWeight: 700, color: tc.text,
                                textTransform: 'capitalize',
                              }}>
                                {entry.entry_type}
                              </span>
                            </div>
                            <button
                              onClick={() => toggleEntry(entry.id)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: 'var(--brand-700)', border: '1px solid rgba(30,53,82,0.6)',
                                borderRadius: 8, padding: '4px 10px',
                                fontSize: 12, fontWeight: 500, color: 'var(--text-muted)',
                                cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                            >
                              {isOpen ? <><EyeOff size={12} />Hide</> : <><Eye size={12} />Details</>}
                            </button>
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                            {entry.description}
                          </p>
                          {entry.ai_summary && (
                            <div style={{
                              background: 'rgba(26,111,212,0.06)', border: '1px dashed rgba(26,111,212,0.25)',
                              borderRadius: 10, padding: '10px 12px',
                              fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6,
                            }}>
                              <ReactMarkdown>{entry.ai_summary}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>

                      {isOpen && (
                        <div style={{
                          borderTop: '1px solid rgba(30,53,82,0.5)',
                          padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12,
                          background: 'rgba(13,27,42,0.4)',
                        }}>
                          {entry.metadata?.snippet_preview && (
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Code</p>
                              <pre style={{
                                fontSize: 12, color: '#70b3ee',
                                background: 'var(--brand-950)', border: '1px solid rgba(30,53,82,0.7)',
                                borderRadius: 10, padding: '10px 14px', overflowX: 'auto', margin: 0,
                                fontFamily: "'JetBrains Mono', monospace",
                              }}>
                                {entry.metadata.snippet_preview}
                              </pre>
                            </div>
                          )}
                          {entry.files.length > 0 && (
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Files touched</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {formatFilesForEntry(entry).map((detail, idx) => (
                                  <span
                                    key={`${entry.id}-f-${idx}`}
                                    title={detail.timestamp ? `Touched at ${new Date(detail.timestamp).toLocaleString()}` : undefined}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 4,
                                      background: 'rgba(26,111,212,0.1)', border: '1px solid rgba(26,111,212,0.25)',
                                      borderRadius: 20, padding: '3px 10px',
                                      fontSize: 11, color: '#70b3ee',
                                    }}
                                  >
                                    <FileCode size={11} /> {detail.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {(entry.task_ids.length > 0 || entry.requirement_ids.length > 0) && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                              {entry.task_ids.length > 0 && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                                  <ListChecks size={12} color="var(--text-faint)" />
                                  {entry.task_ids.join(', ')}
                                </span>
                              )}
                              {entry.requirement_ids.length > 0 && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                                  <GitMerge size={12} color="var(--text-faint)" />
                                  {entry.requirement_ids.join(', ')}
                                </span>
                              )}
                            </div>
                          )}
                          {entry.diagram_url && (
                            <div style={{ borderRadius: 10, border: '1px solid rgba(30,53,82,0.6)', overflow: 'hidden' }}>
                              <img src={entry.diagram_url} alt="Diagram" style={{ width: '100%', maxHeight: 240, objectFit: 'contain' }} />
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