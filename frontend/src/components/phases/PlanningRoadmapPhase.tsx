import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Calendar,
  ZoomIn,
  ZoomOut,
  Flag,
  CheckCircle2,
  Circle,
  Play,
  Clock,
  Target,
  Sparkles,
  Loader2,
  Link2,
  Milestone,
  ArrowRight,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';

interface RoadmapMilestone {
  id: string;
  name: string;
  phase: string;
  startMonth: number;
  endMonth: number;
  progress: number;
  status: 'completed' | 'in_progress' | 'upcoming';
  color: string;
  dependencies?: string[];
  subItems?: RoadmapSubItem[];
}

interface RoadmapSubItem {
  id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  notes?: string;
}

interface PlanningRoadmapPhaseProps {
  projectId: string;
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
}

export const PlanningRoadmapPhase: React.FC<PlanningRoadmapPhaseProps> = ({
  projectId,
  onGenerate,
  isGenerating,
}) => {
  const [viewMode, setViewMode] = useState<'quarterly' | 'monthly'>('quarterly');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftMilestone, setDraftMilestone] = useState<Omit<RoadmapMilestone, 'id'>>({
    name: '',
    phase: 'Planning',
    startMonth: 0,
    endMonth: 1,
    progress: 0,
    status: 'upcoming',
    color: 'blue',
    dependencies: [],
  });

  const loadRoadmap = useCallback(async () => {
    if (!projectId) return;
    setLoadingRoadmap(true);
    setError(null);
    try {
      const data = await api.getRoadmap(projectId);
      setMilestones((data.milestones || []) as RoadmapMilestone[]);
    } catch (err) {
      console.error('Failed to load roadmap', err);
      setError('Unable to load roadmap milestones.');
    } finally {
      setLoadingRoadmap(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadRoadmap();
  }, [loadRoadmap]);

  const persistRoadmap = useCallback(
    async (nextMilestones: RoadmapMilestone[]) => {
      if (!projectId) return;
      setSavingRoadmap(true);
      setError(null);
      setMilestones(nextMilestones);
      try {
        const summary = nextMilestones.map((m) => {
          const start = months[Math.max(0, Math.min(months.length - 1, Math.floor(m.startMonth)))] || 'TBD';
          const end = months[Math.max(0, Math.min(months.length - 1, Math.floor(m.endMonth)))] || start;
          return {
            id: m.id,
            name: m.name,
            phase: m.phase,
            status: m.status,
            window: `${start} → ${end}`,
            progress: m.progress,
          };
        });
        await api.saveRoadmap(projectId, { milestones: nextMilestones, summary });
      } catch (err) {
        console.error('Failed to save roadmap', err);
        setError('Saving roadmap failed. Please retry.');
      } finally {
        setSavingRoadmap(false);
      }
    },
    [projectId]
  );

  const handleAddMilestone = async () => {
    if (!draftMilestone.name.trim()) return;
    const newMilestone: RoadmapMilestone = {
      ...draftMilestone,
      id: `mile_${Math.random().toString(36).slice(2, 9)}`,
    };
    await persistRoadmap([newMilestone, ...milestones]);
    setDraftMilestone({
      name: '',
      phase: draftMilestone.phase,
      startMonth: 0,
      endMonth: 1,
      progress: 0,
      status: 'upcoming',
      color: draftMilestone.color,
      dependencies: [],
    });
    setSelectedMilestone(newMilestone.id);
  };

  const handleUpdateMilestone = async (milestoneId: string, updates: Partial<RoadmapMilestone>) => {
    const next = milestones.map((m) => (m.id === milestoneId ? { ...m, ...updates } : m));
    await persistRoadmap(next);
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    const next = milestones.filter((m) => m.id !== milestoneId);
    await persistRoadmap(next);
    if (selectedMilestone === milestoneId) {
      setSelectedMilestone(null);
    }
  };

  const handleAddSubItem = async (milestoneId: string) => {
    const next = milestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            subItems: [
              ...(m.subItems || []),
              {
                id: `sub_${Math.random().toString(36).slice(2, 9)}`,
                title: 'New sub-item',
                status: 'upcoming' as RoadmapSubItem['status'],
              },
            ],
          }
        : m
    );
    await persistRoadmap(next);
  };

  const handleUpdateSubItem = async (
    milestoneId: string,
    subItemId: string,
    patch: Partial<RoadmapSubItem>
  ) => {
    const next = milestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            subItems: (m.subItems || []).map((child) =>
              child.id === subItemId ? { ...child, ...patch } : child
            ),
          }
        : m
    );
    await persistRoadmap(next);
  };

  const handleDeleteSubItem = async (milestoneId: string, subItemId: string) => {
    const next = milestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            subItems: (m.subItems || []).filter((child) => child.id !== subItemId),
          }
        : m
    );
    await persistRoadmap(next);
  };

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const statusOptions: RoadmapMilestone['status'][] = ['completed', 'in_progress', 'upcoming'];
  const phaseOptions = ['Planning', 'Feasibility', 'Requirements', 'Design', 'Development', 'Testing', 'Deployment', 'Launch'];
  const colorOptions = ['purple', 'blue', 'red', 'green', 'amber', 'cyan', 'emerald'];

  const colorMap: Record<string, { bg: string; border: string; text: string; bar: string }> = {
    purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', bar: 'bg-purple-500' },
    blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', bar: 'bg-blue-500' },
    red: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', bar: 'bg-red-500' },
    green: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700', bar: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700', bar: 'bg-amber-500' },
    cyan: { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-700', bar: 'bg-cyan-500' },
    emerald: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const orderedMilestones = useMemo(() =>
    [...milestones].sort((a, b) => a.startMonth - b.startMonth),
    [milestones]
  );

  const milestonesOnly = useMemo(() => orderedMilestones, [orderedMilestones]);

  const totalMonths = 12;
  const monthWidth = (100 / totalMonths) * (zoomLevel / 100);
  const overallProgress = milestonesOnly.length
    ? Math.round(milestonesOnly.reduce((a, m) => a + (m.progress || 0), 0) / milestonesOnly.length)
    : 0;

  const planBullets = useMemo(() =>
    milestonesOnly.map((m) => {
      const start = months[Math.max(0, Math.min(months.length - 1, Math.floor(m.startMonth)))] || 'TBD';
      const end = months[Math.max(0, Math.min(months.length - 1, Math.floor(m.endMonth)))] || start;
      return {
        id: m.id,
        name: m.name,
        phase: m.phase,
        status: m.status,
        window: `${start} → ${end}`,
        progress: m.progress,
      };
    }),
    [milestonesOnly, months]
  );

  return (
    <div className="space-y-6">
      {/* Roadmap Builder - Navy Card */}
      <div className="rounded-3xl shadow-xl overflow-hidden" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
        <div className="p-6" style={{ background: 'linear-gradient(to right, #b8962e, #d4af37, #e6c358)' }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl backdrop-blur-sm" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <Milestone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white" style={{ color: '#0a0f1a' }}>Roadmap Builder</h2>
                <p className="text-sm" style={{ color: 'rgba(10,15,26,0.8)' }}>Create and manage project milestones</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${savingRoadmap ? 'bg-amber-100 text-amber-700' : ''}`} style={!savingRoadmap ? { backgroundColor: 'rgba(10,15,26,0.2)', color: '#0a0f1a' } : {}}>
              {savingRoadmap ? '⏳ Saving...' : '✓ Autosaved'}
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Milestone Name</label>
              <Input
                placeholder="Define the milestone..."
                value={draftMilestone.name}
                onChange={(e) => setDraftMilestone((prev) => ({ ...prev, name: e.target.value }))}
                className="text-white placeholder-gray-500"
                style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}
              />
              <label className="text-sm font-medium text-gray-300">Phase</label>
              <select
                className="w-full rounded-lg px-3 py-2 text-sm text-white"
                style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}
                value={draftMilestone.phase}
                onChange={(e) => setDraftMilestone((prev) => ({ ...prev, phase: e.target.value }))}
              >
                {phaseOptions.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
              </select>
              <label className="text-sm font-medium text-gray-300">Timeline (month index)</label>
              <div className="flex gap-3">
                <Input
                  type="number"
                  min={0}
                  max={11}
                  value={draftMilestone.startMonth}
                  onChange={(e) =>
                    setDraftMilestone((prev) => ({ ...prev, startMonth: Number(e.target.value) }))
                  }
                  placeholder="Start"
                  className="text-white"
                  style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}
                />
                <Input
                  type="number"
                  min={draftMilestone.startMonth}
                  max={12}
                  value={draftMilestone.endMonth}
                  onChange={(e) =>
                    setDraftMilestone((prev) => ({ ...prev, endMonth: Number(e.target.value) }))
                  }
                  placeholder="End"
                  className="text-white"
                  style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Status</label>
              <select
                className="w-full rounded-lg px-3 py-2 text-sm text-white"
                style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}
                value={draftMilestone.status}
                onChange={(e) => setDraftMilestone((prev) => ({ ...prev, status: e.target.value as RoadmapMilestone['status'] }))}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <label className="text-sm font-medium text-gray-300">Progress (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={draftMilestone.progress}
                onChange={(e) =>
                  setDraftMilestone((prev) => ({ ...prev, progress: Number(e.target.value) }))
                }
                className="text-white"
                style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}
              />
              <label className="text-sm font-medium text-gray-300">Color Theme</label>
              <select
                className="w-full rounded-lg px-3 py-2 text-sm text-white"
                style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}
                value={draftMilestone.color}
                onChange={(e) => setDraftMilestone((prev) => ({ ...prev, color: e.target.value }))}
              >
                {colorOptions.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
              <label className="text-sm font-medium text-gray-300">Dependencies</label>
              <select
                multiple
                value={draftMilestone.dependencies || []}
                onChange={(e) =>
                  setDraftMilestone((prev) => ({
                    ...prev,
                    dependencies: Array.from(e.target.selectedOptions, (option) => option.value),
                  }))
                }
                className="w-full rounded-lg px-3 py-2 text-sm h-24 text-white"
                style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}
              >
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <p className="text-sm text-gray-500">
              💡 Start/end are month indexes (0 = Jan). Use dependencies to define task ordering.
            </p>
            <Button 
              onClick={handleAddMilestone} 
              disabled={!draftMilestone.name.trim()}
              className="shadow-lg"
              style={{ background: 'linear-gradient(to right, #d4af37, #b8962e)', color: '#0a0f1a' }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          </div>
          {error && (
            <div className="rounded-xl p-3 text-sm flex items-center gap-2" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Strategic Plan Highlights - Navy Design */}
      <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl shadow-sm" style={{ backgroundColor: '#0d1525' }}>
            <Target className="h-5 w-5" style={{ color: '#d4af37' }} />
          </div>
          <div>
            <h3 className="font-bold text-white">Strategic Plan Highlights</h3>
            <p className="text-sm text-gray-500">Key milestones from your roadmap</p>
          </div>
        </div>
        {planBullets.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#152238' }}>
              <Flag className="h-8 w-8 text-gray-500" />
            </div>
            <p className="text-gray-500">Add milestones above to see your planning brief</p>
          </div>
        ) : (
          <div className="space-y-3">
            {planBullets.map((bullet, idx) => (
              <div key={bullet.id} className="flex items-start gap-4 p-4 rounded-xl transition-shadow" style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  bullet.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                  bullet.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                  'text-gray-500'
                }`} style={bullet.status === 'upcoming' ? { backgroundColor: '#152238' } : {}}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{bullet.name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#152238', color: '#9ca3af' }}>{bullet.phase}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">{bullet.window}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className={`text-xs font-medium ${
                      bullet.progress >= 80 ? 'text-emerald-400' :
                      bullet.progress >= 40 ? 'text-amber-400' :
                      'text-gray-500'
                    }`}>{bullet.progress}% complete</span>
                  </div>
                </div>
                {getStatusIcon(bullet.status)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls - Navy Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl shadow-sm" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl p-1" style={{ backgroundColor: '#0d1525' }}>
            <button
              onClick={() => setViewMode('quarterly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'quarterly' ? 'shadow-sm text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
              style={viewMode === 'quarterly' ? { backgroundColor: '#152238' } : {}}
            >
              Quarterly
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'monthly' ? 'shadow-sm text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
              style={viewMode === 'monthly' ? { backgroundColor: '#152238' } : {}}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ backgroundColor: '#0d1525' }}>
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
              disabled={zoomLevel <= 50}
              className="p-2 rounded-lg transition-all disabled:opacity-40 text-gray-400 hover:text-white"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold w-12 text-center text-gray-300">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
              disabled={zoomLevel >= 200}
              className="p-2 rounded-lg transition-all disabled:opacity-40 text-gray-400 hover:text-white"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: '#0d1525' }}>
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-400">2024</span>
          </div>
        </div>

        <Button 
          onClick={() => onGenerate('Generate project roadmap with milestones and dependencies')} 
          disabled={isGenerating}
          className="shadow-lg"
          style={{ background: 'linear-gradient(to right, #d4af37, #b8962e)', color: '#0a0f1a' }}
        >
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          AI Generate
        </Button>
      </div>

      {/* Timeline Legend */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm text-gray-400">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-gray-400">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-400">Upcoming</span>
        </div>
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-400">Dependencies</span>
        </div>
      </div>

      {/* Roadmap Timeline - Navy Card */}
      <div className="rounded-3xl shadow-xl overflow-hidden" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
        <div className="p-6" style={{ background: 'linear-gradient(to right, #1e3a5f, #152238)' }}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl backdrop-blur-sm" style={{ backgroundColor: 'rgba(212,175,55,0.2)' }}>
              <Calendar className="h-6 w-6" style={{ color: '#d4af37' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Project Timeline</h2>
              <p className="text-sm text-gray-400">Visual representation of milestones and dependencies</p>
            </div>
          </div>
        </div>
        <div className="p-0">
          {loadingRoadmap ? (
            <div className="p-8 text-center text-gray-500">Loading roadmap...</div>
          ) : milestones.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No milestones yet. Use the builder above or AI generate to create your roadmap.
            </div>
          ) : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${zoomLevel * 10}px` }}>
              {/* Month/Quarter Headers */}
              <div className="flex" style={{ borderBottom: '1px solid #1e3a5f', backgroundColor: '#0d1525' }}>
                <div className="w-48 flex-shrink-0 p-3 font-medium text-gray-300" style={{ borderRight: '1px solid #1e3a5f' }}>
                  Phase
                </div>
                <div className="flex-1 flex">
                  {viewMode === 'quarterly'
                    ? quarters.map((q) => (
                        <div
                          key={q}
                          className="flex-1 p-3 text-center font-medium text-gray-300"
                          style={{ minWidth: `${monthWidth * 3}%`, borderRight: '1px solid #1e3a5f' }}
                        >
                          {q} 2024
                        </div>
                      ))
                    : months.map((m) => (
                        <div
                          key={m}
                          className="flex-1 p-2 text-center text-sm text-gray-400"
                          style={{ minWidth: `${monthWidth}%`, borderRight: '1px solid #1e3a5f' }}
                        >
                          {m}
                        </div>
                      ))}
                </div>
              </div>

              {/* Milestone Rows */}
              <div className="relative">
                {milestonesOnly.map((milestone) =>
                  milestone.dependencies?.map((depId) => {
                    const dep = milestonesOnly.find((m) => m.id === depId);
                    if (!dep) return null;
                    const depIdx = milestones.findIndex((m) => m.id === depId);
                    const mIdx = milestones.findIndex((m) => m.id === milestone.id);
                    
                    if (depIdx >= mIdx) return null;
                    
                    return (
                      <div
                        key={`${depId}-${milestone.id}`}
                        className="absolute pointer-events-none"
                        style={{
                          left: `calc(192px + ${(dep.endMonth / totalMonths) * 100}%)`,
                          top: `${depIdx * 72 + 36}px`,
                          width: '2px',
                          height: `${(mIdx - depIdx) * 72}px`,
                          background: 'linear-gradient(to bottom, #1e3a5f 50%, transparent 50%)',
                          backgroundSize: '2px 8px',
                        }}
                      />
                    );
                  })
                )}

                {milestonesOnly.map((milestone) => {
                  const colors = colorMap[milestone.color];
                  const left = (milestone.startMonth / totalMonths) * 100;
                  const width = ((milestone.endMonth - milestone.startMonth) / totalMonths) * 100;
                  const isSelected = selectedMilestone === milestone.id;

                  return (
                    <div key={milestone.id} style={{ borderBottom: '1px solid #1e3a5f' }}>
                      <div className={`flex transition-colors ${isSelected ? '' : ''}`} style={{ height: '72px', backgroundColor: isSelected ? 'rgba(212,175,55,0.1)' : 'transparent' }}>
                        <div className="w-48 flex-shrink-0 p-3 flex items-center gap-2" style={{ borderRight: '1px solid #1e3a5f' }}>
                          {getStatusIcon(milestone.status)}
                          <div>
                            <div className="font-medium text-white text-sm">{milestone.name}</div>
                            <div className="text-xs text-gray-500">{milestone.phase}</div>
                          </div>
                        </div>
                        <div className="flex-1 relative p-3">
                          <div className="absolute inset-0 flex">
                            {months.map((_, i) => (
                              <div
                                key={i}
                                className="flex-1"
                                style={{ minWidth: `${monthWidth}%`, borderRight: '1px solid rgba(30,58,95,0.5)' }}
                              />
                            ))}
                          </div>
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 h-10 rounded-lg cursor-pointer transition-all hover:scale-y-110 ${colors.border} border-2 ${
                              isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#111b2e]' : ''
                            }`}
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              minWidth: '80px',
                            }}
                            onClick={() => setSelectedMilestone(isSelected ? null : milestone.id)}
                          >
                            <div className={`absolute inset-0 rounded-md ${colors.bg} opacity-50`} />
                            <div
                              className={`absolute inset-y-0 left-0 rounded-l-md ${colors.bar} opacity-80`}
                              style={{ width: `${milestone.progress}%`, borderRadius: milestone.progress === 100 ? '0.375rem' : '0.375rem 0 0 0.375rem' }}
                            />
                            <div className="absolute inset-0 flex items-center justify-between px-2">
                              <span className={`text-xs font-medium ${colors.text} truncate`}>
                                {milestone.progress}%
                              </span>
                              {milestone.status === 'completed' && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                          <div
                            className="absolute top-0 w-px h-full"
                            style={{ left: `${left}%`, backgroundColor: '#1e3a5f' }}
                          >
                            <Flag className="h-3 w-3 text-gray-500 absolute -top-1 -left-1.5" />
                          </div>
                        </div>
                      </div>
                      {milestone.subItems?.length ? (
                        <div className="px-10 py-3 space-y-2" style={{ backgroundColor: '#0d1525', borderTop: '1px solid #1e3a5f' }}>
                          {milestone.subItems.map((child) => (
                            <div key={child.id} className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={child.status === 'completed'}
                                onChange={(e) =>
                                  handleUpdateSubItem(milestone.id, child.id, {
                                    status: e.target.checked ? 'completed' : 'in_progress',
                                  })
                                }
                                className="rounded"
                              />
                              <input
                                className="flex-1 text-sm rounded px-2 py-1 text-white"
                                style={{ backgroundColor: '#152238', border: '1px solid #1e3a5f' }}
                                value={child.title}
                                onChange={(e) => handleUpdateSubItem(milestone.id, child.id, { title: e.target.value })}
                              />
                              <select
                                className="text-xs rounded px-2 py-1 text-white"
                                style={{ backgroundColor: '#152238', border: '1px solid #1e3a5f' }}
                                value={child.status}
                                onChange={(e) => handleUpdateSubItem(milestone.id, child.id, { status: e.target.value as RoadmapSubItem['status'] })}
                              >
                                {statusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {status.replace('_', ' ')}
                                  </option>
                                ))}
                              </select>
                              <button className="text-xs text-red-400" onClick={() => handleDeleteSubItem(milestone.id, child.id)}>
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <div className="px-10 py-2" style={{ backgroundColor: '#0d1525', borderTop: '1px solid #1e3a5f' }}>
                        <button className="text-xs" style={{ color: '#d4af37' }} onClick={() => handleAddSubItem(milestone.id)}>
                          + Add child item
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Selected Milestone Details */}
      {selectedMilestone && (
        <Card className="border-amber-500/30" style={{ backgroundColor: '#111b2e', borderColor: 'rgba(212,175,55,0.3)' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Target className="h-5 w-5" style={{ color: '#d4af37' }} />
              Milestone Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const m = milestones.find((ms) => ms.id === selectedMilestone);
              if (!m) return null;
              const colors = colorMap[m.color];
              return (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Milestone</span>
                      <Input
                        value={m.name}
                        onChange={(e) => handleUpdateMilestone(m.id, { name: e.target.value })}
                        className="mt-1 text-white"
                        style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}
                      />
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Phase</span>
                      <select
                        className="mt-1 w-full rounded-lg px-3 py-2 text-sm text-white"
                        style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}
                        value={m.phase}
                        onChange={(e) => handleUpdateMilestone(m.id, { phase: e.target.value })}
                      >
                        {phaseOptions.map((phase) => (
                          <option key={phase} value={phase}>
                            {phase}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Timeline</span>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          min={0}
                          max={11}
                          value={m.startMonth}
                          onChange={(e) => handleUpdateMilestone(m.id, { startMonth: Number(e.target.value) })}
                          className="text-white"
                          style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}
                        />
                        <Input
                          type="number"
                          min={m.startMonth}
                          max={12}
                          value={m.endMonth}
                          onChange={(e) => handleUpdateMilestone(m.id, { endMonth: Number(e.target.value) })}
                          className="text-white"
                          style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Progress</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#152238' }}>
                          <div className={`h-full ${colors.bar}`} style={{ width: `${m.progress}%` }} />
                        </div>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={m.progress}
                          onChange={(e) => handleUpdateMilestone(m.id, { progress: Number(e.target.value) })}
                          className="w-20 text-white"
                          style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Status</span>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(m.status)}
                        <select
                          className="rounded-lg px-3 py-1.5 text-sm text-white"
                          style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}
                          value={m.status}
                          onChange={(e) => handleUpdateMilestone(m.id, { status: e.target.value as RoadmapMilestone['status'] })}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {m.dependencies && m.dependencies.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-500">Dependencies</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.dependencies.map((depId) => {
                            const dep = milestones.find((ms) => ms.id === depId);
                            return dep ? (
                              <Badge key={depId} variant="secondary" className="text-xs">
                                {dep.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                        <select
                          multiple
                          className="mt-2 w-full rounded-lg px-3 py-2 text-sm h-24 text-white"
                          style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}
                          value={m.dependencies || []}
                          onChange={(e) =>
                            handleUpdateMilestone(m.id, {
                              dependencies: Array.from(e.target.selectedOptions, (option) => option.value),
                            })
                          }
                        >
                          {milestones
                            .filter((ms) => ms.id !== m.id)
                            .map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-gray-500">Color Theme</span>
                      <select
                        className="w-full rounded-lg px-3 py-2 text-sm mt-1 text-white"
                        style={{ backgroundColor: '#0d1525', border: '1px solid #1e3a5f' }}
                        value={m.color}
                        onChange={(e) => handleUpdateMilestone(m.id, { color: e.target.value })}
                      >
                        {colorOptions.map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleDeleteMilestone(m.id)} className="text-red-400 border-red-400/30 hover:bg-red-500/10">
                        Delete Milestone
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(16,185,129,0.2)' }}>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {milestonesOnly.filter((m) => m.status === 'completed').length}
                </p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.2)' }}>
                <Play className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {milestonesOnly.filter((m) => m.status === 'in_progress').length}
                </p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#152238' }}>
                <Circle className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {milestonesOnly.filter((m) => m.status === 'upcoming').length}
                </p>
                <p className="text-xs text-gray-500">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(212,175,55,0.2)' }}>
                <Clock className="h-5 w-5" style={{ color: '#d4af37' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">12</p>
                <p className="text-xs text-gray-500">Months Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
        <CardHeader style={{ background: 'linear-gradient(to right, rgba(212,175,55,0.1), rgba(184,150,46,0.05))' }}>
          <CardTitle className="flex items-center gap-2 text-white">
            <Milestone className="h-5 w-5" style={{ color: '#d4af37' }} />
            Roadmap Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#0d1525' }}>
              <span className="text-gray-400">Overall Progress</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#152238' }}>
                  <div
                    style={{ width: `${overallProgress}%`, background: 'linear-gradient(to right, #d4af37, #b8962e)' }}
                    className="h-full"
                  />
                </div>
                <span className="font-bold text-white">{overallProgress}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#0d1525' }}>
              <span className="text-gray-400">Estimated Completion</span>
              <span className="font-bold text-white">December 2024</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#0d1525' }}>
              <span className="text-gray-400">Next Milestone</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">
                  {milestonesOnly.find((m) => m.status === 'in_progress')?.name || milestonesOnly.find((m) => m.status === 'upcoming')?.name || 'N/A'}
                </span>
                <ArrowRight className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanningRoadmapPhase;
