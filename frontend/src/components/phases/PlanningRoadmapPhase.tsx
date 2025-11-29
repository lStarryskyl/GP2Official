import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
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
} from 'lucide-react';

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
  const [visibleQuarter, setVisibleQuarter] = useState(0);

  // Sample roadmap data - would come from API
  const milestones: RoadmapMilestone[] = useMemo(() => [
    { id: 'm1', name: 'Feasibility Complete', phase: 'Feasibility', startMonth: 0, endMonth: 1, progress: 100, status: 'completed', color: 'purple' },
    { id: 'm2', name: 'Requirements Defined', phase: 'Requirements', startMonth: 1, endMonth: 2.5, progress: 75, status: 'in_progress', color: 'blue', dependencies: ['m1'] },
    { id: 'm3', name: 'Architecture Approved', phase: 'Design', startMonth: 2, endMonth: 3.5, progress: 40, status: 'in_progress', color: 'red', dependencies: ['m2'] },
    { id: 'm4', name: 'MVP Development', phase: 'Development', startMonth: 3, endMonth: 6, progress: 0, status: 'upcoming', color: 'green', dependencies: ['m3'] },
    { id: 'm5', name: 'Alpha Testing', phase: 'Testing', startMonth: 5, endMonth: 7, progress: 0, status: 'upcoming', color: 'amber', dependencies: ['m4'] },
    { id: 'm6', name: 'Beta Release', phase: 'Testing', startMonth: 7, endMonth: 9, progress: 0, status: 'upcoming', color: 'amber', dependencies: ['m5'] },
    { id: 'm7', name: 'Production Deployment', phase: 'Deployment', startMonth: 9, endMonth: 10, progress: 0, status: 'upcoming', color: 'cyan', dependencies: ['m6'] },
    { id: 'm8', name: 'Launch', phase: 'Launch', startMonth: 10, endMonth: 11, progress: 0, status: 'upcoming', color: 'emerald', dependencies: ['m7'] },
  ], []);

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  const totalMonths = 12;
  const monthWidth = (100 / totalMonths) * (zoomLevel / 100);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'quarterly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('quarterly')}
              >
                Quarterly
              </Button>
              <Button
                variant={viewMode === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('monthly')}
              >
                Monthly
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                  disabled={zoomLevel <= 50}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-12 text-center">{zoomLevel}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                  disabled={zoomLevel >= 200}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setVisibleQuarter((q) => Math.max(0, q - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-2">2024</span>
                <Button variant="outline" size="sm" onClick={() => setVisibleQuarter((q) => Math.min(3, q + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button onClick={() => onGenerate('Generate project roadmap with milestones and dependencies')} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              AI Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Legend */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm text-gray-600">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-gray-600">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Upcoming</span>
        </div>
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Dependencies</span>
        </div>
      </div>

      {/* Roadmap Timeline */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            Project Roadmap Timeline
          </CardTitle>
          <CardDescription>Visual representation of project phases and milestones</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${zoomLevel * 10}px` }}>
              {/* Month/Quarter Headers */}
              <div className="flex border-b bg-gray-50">
                <div className="w-48 flex-shrink-0 p-3 border-r font-medium text-gray-700">
                  Phase
                </div>
                <div className="flex-1 flex">
                  {viewMode === 'quarterly'
                    ? quarters.map((q, i) => (
                        <div
                          key={q}
                          className="flex-1 p-3 text-center font-medium text-gray-700 border-r"
                          style={{ minWidth: `${monthWidth * 3}%` }}
                        >
                          {q} 2024
                        </div>
                      ))
                    : months.map((m, i) => (
                        <div
                          key={m}
                          className="flex-1 p-2 text-center text-sm text-gray-600 border-r"
                          style={{ minWidth: `${monthWidth}%` }}
                        >
                          {m}
                        </div>
                      ))}
                </div>
              </div>

              {/* Milestone Rows */}
              <div className="relative">
                {/* Dependency Lines - rendered as absolute positioned divs instead of SVG */}
                {milestones.map((milestone) =>
                  milestone.dependencies?.map((depId) => {
                    const dep = milestones.find((m) => m.id === depId);
                    if (!dep) return null;
                    const depIdx = milestones.findIndex((m) => m.id === depId);
                    const mIdx = milestones.findIndex((m) => m.id === milestone.id);
                    
                    // Only show connector line when dependency is above
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
                          background: 'linear-gradient(to bottom, #CBD5E1 50%, transparent 50%)',
                          backgroundSize: '2px 8px',
                        }}
                      />
                    );
                  })
                )}

                {milestones.map((milestone, idx) => {
                  const colors = colorMap[milestone.color];
                  const left = (milestone.startMonth / totalMonths) * 100;
                  const width = ((milestone.endMonth - milestone.startMonth) / totalMonths) * 100;
                  const isSelected = selectedMilestone === milestone.id;

                  return (
                    <div
                      key={milestone.id}
                      className={`flex border-b hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                      style={{ height: '72px' }}
                    >
                      {/* Phase Name */}
                      <div className="w-48 flex-shrink-0 p-3 border-r flex items-center gap-2">
                        {getStatusIcon(milestone.status)}
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{milestone.name}</div>
                          <div className="text-xs text-gray-500">{milestone.phase}</div>
                        </div>
                      </div>

                      {/* Timeline Bar */}
                      <div className="flex-1 relative p-3">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex">
                          {months.map((_, i) => (
                            <div
                              key={i}
                              className="flex-1 border-r border-gray-100"
                              style={{ minWidth: `${monthWidth}%` }}
                            />
                          ))}
                        </div>

                        {/* Milestone Bar */}
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 h-10 rounded-lg cursor-pointer transition-all hover:scale-y-110 ${colors.border} border-2 ${
                            isSelected ? 'ring-2 ring-blue-400 ring-offset-2' : ''
                          }`}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            minWidth: '80px',
                          }}
                          onClick={() => setSelectedMilestone(isSelected ? null : milestone.id)}
                        >
                          {/* Background */}
                          <div className={`absolute inset-0 rounded-md ${colors.bg} opacity-50`} />

                          {/* Progress Fill */}
                          <div
                            className={`absolute inset-y-0 left-0 rounded-l-md ${colors.bar} opacity-80`}
                            style={{ width: `${milestone.progress}%`, borderRadius: milestone.progress === 100 ? '0.375rem' : '0.375rem 0 0 0.375rem' }}
                          />

                          {/* Label */}
                          <div className="absolute inset-0 flex items-center justify-between px-2">
                            <span className={`text-xs font-medium ${colors.text} truncate`}>
                              {milestone.progress}%
                            </span>
                            {milestone.status === 'completed' && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Start/End Flags */}
                        <div
                          className="absolute top-0 w-px h-full bg-gray-300"
                          style={{ left: `${left}%` }}
                        >
                          <Flag className="h-3 w-3 text-gray-400 absolute -top-1 -left-1.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Milestone Details */}
      {selectedMilestone && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
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
                      <p className="font-medium">{m.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Phase</span>
                      <p className="font-medium">{m.phase}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Timeline</span>
                      <p className="font-medium">
                        {months[Math.floor(m.startMonth)]} → {months[Math.floor(m.endMonth)]}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Progress</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full ${colors.bar}`} style={{ width: `${m.progress}%` }} />
                        </div>
                        <span className="font-medium">{m.progress}%</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Status</span>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(m.status)}
                        <Badge variant={m.status === 'completed' ? 'success' : m.status === 'in_progress' ? 'warning' : 'secondary'}>
                          {m.status.replace('_', ' ')}
                        </Badge>
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
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {milestones.filter((m) => m.status === 'completed').length}
                </p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Play className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {milestones.filter((m) => m.status === 'in_progress').length}
                </p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-50 to-white border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Circle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {milestones.filter((m) => m.status === 'upcoming').length}
                </p>
                <p className="text-xs text-gray-500">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-xs text-gray-500">Months Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
          <CardTitle className="flex items-center gap-2">
            <Milestone className="h-5 w-5 text-amber-600" />
            Roadmap Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Overall Progress</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: `${Math.round(milestones.reduce((a, m) => a + m.progress, 0) / milestones.length)}%` }}
                  />
                </div>
                <span className="font-bold">{Math.round(milestones.reduce((a, m) => a + m.progress, 0) / milestones.length)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Estimated Completion</span>
              <span className="font-bold">December 2024</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Next Milestone</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">
                  {milestones.find((m) => m.status === 'in_progress')?.name || milestones.find((m) => m.status === 'upcoming')?.name}
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanningRoadmapPhase;
