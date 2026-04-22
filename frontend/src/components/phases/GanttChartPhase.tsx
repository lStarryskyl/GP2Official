import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Task } from '@/types';
import {
  Sparkles,
  Loader2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Flag,
  Link2,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  BarChart3,
  Play,
  Pause,
  Filter,
  Download,
} from 'lucide-react';

interface GanttTask {
  id: string;
  name: string;
  phase: string;
  startDay: number;
  duration: number;
  progress: number;
  status: 'completed' | 'in_progress' | 'upcoming' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies?: string[];
  isMilestone?: boolean;
  assignee?: string;
}

interface GanttChartPhaseProps {
  projectId: string;
  tasks: Task[];
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  onUpdateTask: (id: string, patch: Partial<Task>) => Promise<void>;
}

export const GanttChartPhase: React.FC<GanttChartPhaseProps> = ({
  projectId,
  tasks: externalTasks,
  onGenerate,
  isGenerating,
  onUpdateTask,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [showDependencies, setShowDependencies] = useState(true);
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(externalTasks);

  // Keep localTasks in sync when externalTasks change
  React.useEffect(() => {
    setLocalTasks(externalTasks);
  }, [externalTasks]);

  // Derive Gantt tasks from real project tasks
  const ganttTasks: GanttTask[] = useMemo(() => {
    if (!localTasks.length) return [];

    const tasksWithDates = localTasks.filter((t) => t.start_date || t.due_date);
    if (!tasksWithDates.length) return [];

    const parseDate = (value?: string) => (value ? new Date(value) : undefined);

    const dates: Date[] = [];
    tasksWithDates.forEach((t) => {
      const s = parseDate(t.start_date);
      const e = parseDate(t.due_date);
      if (s) dates.push(s);
      if (e) dates.push(e);
    });
    if (!dates.length) return [];

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));

    const dayDiff = (d: Date) => Math.round((d.getTime() - minDate.getTime()) / 86400000);

    const mapStatus = (status: string): GanttTask['status'] => {
      const s = (status || '').toLowerCase();
      if (s === 'completed') return 'completed';
      if (s === 'in_progress') return 'in_progress';
      if (s === 'blocked') return 'blocked';
      return 'upcoming';
    };

    const mapPriority = (priority: string): GanttTask['priority'] => {
      const p = (priority || '').toLowerCase();
      if (p === 'critical') return 'critical';
      if (p === 'high') return 'high';
      if (p === 'medium') return 'medium';
      if (p === 'low') return 'low';
      return 'medium';
    };

    return tasksWithDates.map<GanttTask>((t) => {
      const start = parseDate(t.start_date) || minDate;
      const end = parseDate(t.due_date) || start;
      const startDay = Math.max(0, dayDiff(start));
      const duration = Math.max(1, dayDiff(end) - startDay + 1);

      const estimate = t.estimate_hours || 0;
      const actual = t.actual_hours || 0;
      const progress = estimate > 0 ? Math.min(100, Math.round((actual / estimate) * 100)) : 0;

      return {
        id: t.task_id,
        name: t.title,
        phase: t.phase || 'General',
        startDay,
        duration,
        progress,
        status: mapStatus(t.status),
        priority: mapPriority(t.priority),
        dependencies: t.dependencies,
        isMilestone: t.tags?.includes('milestone'),
      };
    });
  }, [localTasks]);

  const totalDays = Math.max(70, ganttTasks.reduce((max, t) => Math.max(max, t.startDay + t.duration), 0) || 70);
  const dayWidth = viewMode === 'days' ? 30 : viewMode === 'weeks' ? 120 : 360;

  const priorityColors: Record<string, { bg: string; border: string; text: string; bar: string }> = {
    critical: { bg: 'bg-red-900/30', border: 'border-red-600/50', text: 'text-red-300', bar: 'bg-red-500' },
    high: { bg: 'bg-orange-900/30', border: 'border-orange-600/50', text: 'text-orange-300', bar: 'bg-orange-500' },
    medium: { bg: 'bg-blue-900/30', border: 'border-blue-600/50', text: 'text-blue-300', bar: 'bg-blue-500' },
    low: { bg: 'bg-[var(--brand-700)]', border: 'border-[var(--brand-600)]', text: 'text-gray-400', bar: 'bg-gray-500' },
  };

  const statusIcons: Record<string, React.ReactNode> = {
    completed: <CheckCircle2 className="h-4 w-4 text-blue-400" />,
    in_progress: <Play className="h-4 w-4 text-blue-500" />,
    upcoming: <Circle className="h-4 w-4 text-gray-400" />,
    blocked: <AlertTriangle className="h-4 w-4 text-red-500" />,
  };

  // Calculate critical path (simplified - tasks with critical priority)
  const criticalPathTasks = useMemo(() => {
    return ganttTasks.filter(t => t.priority === 'critical').map(t => t.id);
  }, [ganttTasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!filterPriority) return ganttTasks;
    return ganttTasks.filter(t => t.priority === filterPriority);
  }, [ganttTasks, filterPriority]);

  // Group by phase
  const phases = useMemo(() => {
    const phaseMap = new Map<string, GanttTask[]>();
    filteredTasks.forEach(task => {
      if (!phaseMap.has(task.phase)) phaseMap.set(task.phase, []);
      phaseMap.get(task.phase)!.push(task);
    });
    return Array.from(phaseMap.entries());
  }, [filteredTasks]);

  // Stats
  const stats = useMemo(() => {
    if (!ganttTasks.length) {
      return { total: 0, completed: 0, inProgress: 0, milestones: 0, overallProgress: 0 };
    }
    const total = ganttTasks.length;
    const completed = ganttTasks.filter((t) => t.status === 'completed').length;
    const inProgress = ganttTasks.filter((t) => t.status === 'in_progress').length;
    const milestones = ganttTasks.filter((t) => t.isMilestone).length;
    const overallProgress = Math.round(ganttTasks.reduce((a, t) => a + t.progress, 0) / total);
    return { total, completed, inProgress, milestones, overallProgress };
  }, [ganttTasks]);

  const handleToggleTaskDone = async (task: Task) => {
    const currentStatus = (task.status || '').toLowerCase();
    const done = currentStatus === 'completed';
    const nextStatus = done ? 'planned' : 'completed';
    setLocalTasks((prev) =>
      prev.map((t) => (t.task_id === task.task_id ? { ...t, status: nextStatus } : t))
    );
    try {
      await onUpdateTask(task.task_id, { status: nextStatus });
    } catch (err) {
      console.error('Update task status failed', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-[var(--brand-850)] border-[var(--brand-700)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-900/40 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-gray-400">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--brand-850)] border-blue-700/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
                <p className="text-xs text-gray-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--brand-850)] border-orange-700/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-900/30 rounded-lg">
                <Play className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
                <p className="text-xs text-gray-400">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--brand-850)] border-purple-700/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-900/30 rounded-lg">
                <Flag className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.milestones}</p>
                <p className="text-xs text-gray-400">Milestones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--brand-850)] border-[var(--brand-700)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.overallProgress}%</p>
                <p className="text-xs text-gray-400">Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* To-do Checklist + Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] items-start">
            {/* Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">Task To-do List</span>
                <span className="text-xs text-gray-500">
                  {localTasks.length} total •{' '}
                  {localTasks.filter((t) => (t.status || '').toLowerCase() === 'completed').length} done
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {localTasks.map((task) => {
                  const done = (task.status || '').toLowerCase() === 'completed';
                  return (
                    <div
                      key={task.task_id}
                      className={`flex items-start gap-2 p-2 rounded-lg border text-xs sm:text-sm ${
                        done
                          ? 'bg-blue-900/20 border-blue-700/40 text-blue-200'
                          : 'bg-[var(--brand-850)] border-[var(--brand-700)] hover:border-blue-600/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 h-3.5 w-3.5 rounded border-[var(--brand-600)] text-blue-400 focus:ring-blue-500"
                        checked={done}
                        onChange={() => handleToggleTaskDone(task)}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-medium truncate ${
                            done ? 'line-through opacity-70' : 'text-gray-200'
                          }`}
                        >
                          {task.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                          {task.priority && (
                            <span className="px-1.5 py-0.5 rounded-full bg-[var(--brand-700)] capitalize">
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!localTasks.length && (
                  <p className="text-xs text-gray-500">No tasks yet for this project.</p>
                )}
              </div>
            </div>

            {/* Gantt Controls */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 justify-end">
              {/* View Mode */}
              <div className="flex items-center gap-1 bg-[var(--brand-850)] border border-[var(--brand-700)] rounded-lg p-1">
                {['days', 'weeks', 'months'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as typeof viewMode)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      viewMode === mode ? 'bg-[var(--brand-700)] shadow text-white' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

              {/* Zoom */}
              <div className="flex items-center gap-1 bg-[var(--brand-850)] border border-[var(--brand-700)] rounded-lg px-2 py-1">
                <Button variant="ghost" size="sm" onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-12 text-center">{zoomLevel}%</span>
                <Button variant="ghost" size="sm" onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              {/* Toggles */}
              <Button
                variant={showDependencies ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDependencies(!showDependencies)}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Dependencies
              </Button>
              <Button
                variant={showCriticalPath ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowCriticalPath(!showCriticalPath)}
                className={showCriticalPath ? 'bg-red-500 hover:bg-red-600' : ''}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Critical Path
              </Button>

              {/* Priority Filter */}
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filterPriority || ''}
                  onChange={(e) => setFilterPriority(e.target.value || null)}
                  className="border rounded-lg px-2 py-1.5 text-sm"
                >
                  <option value="">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const headers = ['ID', 'Name', 'Phase', 'Status', 'Priority', 'Start Date', 'Due Date', 'Progress (%)'];
                  const rows = localTasks.map((t) => [
                    t.task_id,
                    `"${t.title.replace(/"/g, '""')}"`,
                    `"${(t.phase || 'General').replace(/"/g, '""')}"`,
                    t.status,
                    t.priority,
                    t.start_date || '',
                    t.due_date || '',
                    t.estimate_hours && t.actual_hours
                      ? String(Math.min(100, Math.round((t.actual_hours / t.estimate_hours) * 100)))
                      : '0',
                  ]);
                  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'gantt-tasks.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-[var(--brand-850)] border-b border-[var(--brand-700)]">
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-blue-400" />
            Project Gantt Chart
          </CardTitle>
          <CardDescription className="text-gray-400">Task timeline with dependencies and milestones</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${(totalDays * dayWidth * zoomLevel) / 100 + 300}px` }}>
              {/* Header Row */}
              <div className="flex border-b border-[var(--brand-700)] bg-[var(--brand-850)] sticky top-0 z-10">
                <div className="w-72 flex-shrink-0 p-3 border-r border-[var(--brand-700)] font-medium text-gray-300 bg-[var(--brand-850)]">
                  Task Name
                </div>
                <div className="flex-1 flex">
                  {Array.from({ length: Math.ceil(totalDays / (viewMode === 'days' ? 1 : viewMode === 'weeks' ? 7 : 30)) }, (_, i) => (
                    <div
                      key={i}
                      className="p-2 text-center text-sm text-gray-400 border-r border-[var(--brand-700)] flex-shrink-0"
                      style={{ width: `${dayWidth * (zoomLevel / 100)}px` }}
                    >
                      {viewMode === 'days' ? `Day ${i + 1}` : viewMode === 'weeks' ? `Week ${i + 1}` : `Month ${i + 1}`}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks by Phase */}
              {phases.map(([phase, phaseTasks]) => (
                <div key={phase}>
                  {/* Phase Header */}
                  <div className="flex border-b border-[var(--brand-700)] bg-[var(--brand-800)]">
                    <div className="w-72 flex-shrink-0 p-2 border-r border-[var(--brand-700)] font-semibold text-gray-200 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      {phase}
                    </div>
                    <div className="flex-1" />
                  </div>

                  {/* Phase Tasks */}
                  {phaseTasks.map((task) => {
                    const colors = priorityColors[task.priority];
                    const isCritical = showCriticalPath && criticalPathTasks.includes(task.id);
                    const isSelected = selectedTask === task.id;
                    const barLeft = (task.startDay / totalDays) * 100;
                    const barWidth = (task.duration / totalDays) * 100;

                    return (
                      <div
                        key={task.id}
                        className={`flex border-b border-[var(--brand-700)] hover:bg-[var(--brand-800)] transition-colors ${isSelected ? 'bg-blue-900/20' : ''} ${isCritical ? 'bg-red-900/10' : ''}`}
                        style={{ height: '48px' }}
                      >
                        {/* Task Name */}
                        <div
                          className="w-72 flex-shrink-0 p-2 border-r border-[var(--brand-700)] flex items-center gap-2 cursor-pointer"
                          onClick={() => setSelectedTask(isSelected ? null : task.id)}
                        >
                          {statusIcons[task.status]}
                          <span className={`text-sm text-gray-200 ${task.isMilestone ? 'font-semibold' : ''}`}>
                            {task.isMilestone && <Flag className="inline h-3 w-3 mr-1 text-purple-400" />}
                            {task.name}
                          </span>
                          <Badge variant={task.priority === 'critical' ? 'destructive' : task.priority === 'high' ? 'warning' : 'secondary'} className="text-xs ml-auto">
                            {task.priority}
                          </Badge>
                        </div>

                        {/* Gantt Bar */}
                        <div className="flex-1 relative">
                          {/* Grid */}
                          <div className="absolute inset-0 flex">
                            {Array.from({ length: Math.ceil(totalDays / (viewMode === 'days' ? 1 : viewMode === 'weeks' ? 7 : 30)) }, (_, i) => (
                              <div
                                key={i}
                                className="border-r border-[var(--brand-700)]/50 flex-shrink-0"
                                style={{ width: `${dayWidth * (zoomLevel / 100)}px` }}
                              />
                            ))}
                          </div>

                          {/* Task Bar */}
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 h-7 rounded-md cursor-pointer transition-all hover:scale-y-110 ${
                              task.isMilestone ? 'w-4 h-4 rotate-45' : ''
                            } ${isCritical ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}
                            style={{
                              left: `${barLeft}%`,
                              width: task.isMilestone ? '16px' : `${Math.max(barWidth, 2)}%`,
                              backgroundColor: task.isMilestone ? '#8B5CF6' : undefined,
                            }}
                            onClick={() => setSelectedTask(isSelected ? null : task.id)}
                          >
                            {!task.isMilestone && (
                              <>
                                {/* Background */}
                                <div className={`absolute inset-0 rounded-md ${colors.bg} border ${colors.border}`} />
                                {/* Progress */}
                                <div
                                  className={`absolute inset-y-0 left-0 rounded-l-md ${colors.bar}`}
                                  style={{
                                    width: `${task.progress}%`,
                                    borderRadius: task.progress === 100 ? '0.375rem' : '0.375rem 0 0 0.375rem',
                                  }}
                                />
                                {/* Label */}
                                <div className="absolute inset-0 flex items-center px-2">
                                  <span className={`text-xs font-medium ${colors.text} truncate`}>
                                    {task.progress}%
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Task Details */}
      {selectedTask && (
        <Card className="border-blue-700/40 bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Target className="h-5 w-5 text-blue-400" />
              Task Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const task = ganttTasks.find(t => t.id === selectedTask);
              if (!task) return null;
              const colors = priorityColors[task.priority];
              return (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-400">Task Name</span>
                      <p className="font-medium text-gray-200">{task.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Phase</span>
                      <p className="font-medium text-gray-200">{task.phase}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Duration</span>
                      <p className="font-medium text-gray-200">{task.duration} days (Day {task.startDay + 1} → {task.startDay + task.duration})</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-400">Progress</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[var(--brand-700)] rounded-full overflow-hidden">
                          <div className={colors.bar} style={{ width: `${task.progress}%`, height: '100%' }} />
                        </div>
                        <span className="font-medium text-gray-200">{task.progress}%</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">Priority & Status</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={task.priority === 'critical' ? 'destructive' : task.priority === 'high' ? 'warning' : 'secondary'}>
                          {task.priority}
                        </Badge>
                        <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'secondary'}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        {task.isMilestone && <Badge variant="default">Milestone</Badge>}
                      </div>
                    </div>
                    {task.dependencies && task.dependencies.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-500">Dependencies</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {task.dependencies.map(depId => {
                            const dep = ganttTasks.find(t => t.id === depId);
                            return dep ? (
                              <Badge key={depId} variant="secondary" className="text-xs">
                                {dep.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* AI Generate Section */}
      <Card className="bg-blue-900/20 border-blue-700/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-blue-400" />
            AI Gantt Assistant
          </CardTitle>
          <CardDescription className="text-gray-400">Auto-generate tasks, dependencies, and optimize scheduling</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" onClick={() => onGenerate('Generate project tasks with dependencies and durations')} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Auto-Generate
            </Button>
            <Button variant="outline" onClick={() => onGenerate('Optimize task scheduling and identify critical path')}>
              <TrendingUp className="mr-2 h-4 w-4" /> Optimize
            </Button>
            <Button variant="outline" onClick={() => onGenerate('Identify parallelizable tasks')}>
              <BarChart3 className="mr-2 h-4 w-4" /> Find Parallel
            </Button>
            <Button variant="outline" onClick={() => onGenerate('Recalculate all task dependencies')}>
              <Link2 className="mr-2 h-4 w-4" /> Recalc Deps
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader className="bg-[var(--brand-850)] border-b border-[var(--brand-700)]">
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle2 className="h-5 w-5 text-blue-400" />
            Gantt Chart Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-200 mb-3">Project Timeline</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Total Duration</span>
                  <span className="font-medium text-gray-200">{totalDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Critical Path Tasks</span>
                  <span className="font-medium text-gray-200">{criticalPathTasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Parallelizable Tasks</span>
                  <span className="font-medium text-gray-200">{ganttTasks.length - criticalPathTasks.length}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-200 mb-3">Completion Forecast</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Estimated Completion</span>
                  <span className="font-medium text-gray-200">Day {totalDays}</span>
                </div>
                <div className="flex justify-between">
                  <span>On Track</span>
                  <span className="font-medium text-blue-400">Yes ✓</span>
                </div>
                <div className="flex justify-between">
                  <span>Risk Level</span>
                  <span className="font-medium text-orange-400">Medium</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GanttChartPhase;
