import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  Database,
  GitBranch,
  Layers,
  Box,
  ArrowRight,
  Code,
  Server,
  FileJson,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Plus,
  ExternalLink,
} from 'lucide-react';

interface DiagramType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'complete' | 'partial' | 'empty';
  color: string;
}

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  requestBody?: string;
  responseBody?: string;
  status: 'implemented' | 'planned' | 'deprecated';
}

interface SystemDesignPhaseProps {
  projectId: string;
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  onOpenCanvas: () => void;
}

export const SystemDesignPhase: React.FC<SystemDesignPhaseProps> = ({
  projectId,
  onGenerate,
  isGenerating,
  onOpenCanvas,
}) => {
  const navigate = useNavigate();
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedDiagram, setSelectedDiagram] = useState<string | null>('architecture');
  const [expandedApi, setExpandedApi] = useState<Set<string>>(new Set(['auth']));
  const diagramRef = useRef<HTMLDivElement>(null);

  const handleMaximize = () => {
    const el = diagramRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen().catch(() => {});
    }
  };

  const handleDownloadDiagram = () => {
    const el = diagramRef.current;
    if (!el) return;
    const svgEl = el.querySelector('svg');
    if (svgEl) {
      const blob = new Blob([svgEl.outerHTML], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedDiagram || 'diagram'}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const rect = el.getBoundingClientRect();
    const w = Math.round(rect.width) || 800;
    const h = Math.round(rect.height) || 500;
    const svgContent = [
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}">`,
      `<foreignObject width="100%" height="100%">`,
      `<div xmlns="http://www.w3.org/1999/xhtml" style="background:#f9fafb;padding:16px;box-sizing:border-box;">`,
      el.innerHTML,
      `</div></foreignObject></svg>`,
    ].join('');
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDiagram || 'diagram'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const diagrams: DiagramType[] = [
    { id: 'architecture', name: 'Architecture Diagram', description: 'High-level system components', icon: <Layers className="h-5 w-5" />, status: 'complete', color: 'blue' },
    { id: 'erd', name: 'Database ERD', description: 'Entity relationships', icon: <Database className="h-5 w-5" />, status: 'complete', color: 'blue' },
    { id: 'class', name: 'Class Diagram', description: 'Object-oriented structure', icon: <Box className="h-5 w-5" />, status: 'partial', color: 'purple' },
    { id: 'sequence', name: 'Sequence Diagram', description: 'Object interactions', icon: <ArrowRight className="h-5 w-5" />, status: 'partial', color: 'amber' },
    { id: 'state', name: 'State Machine', description: 'State transitions', icon: <GitBranch className="h-5 w-5" />, status: 'empty', color: 'red' },
    { id: 'activity', name: 'Activity Diagram', description: 'Workflow processes', icon: <Code className="h-5 w-5" />, status: 'empty', color: 'cyan' },
  ];

  const apiGroups: { name: string; id: string; endpoints: APIEndpoint[] }[] = [
    {
      name: 'Authentication',
      id: 'auth',
      endpoints: [
        { method: 'POST', path: '/api/auth/login', description: 'User login', requestBody: '{ email, password }', responseBody: '{ token, user }', status: 'implemented' },
        { method: 'POST', path: '/api/auth/register', description: 'User registration', requestBody: '{ email, password, name }', responseBody: '{ user }', status: 'implemented' },
        { method: 'POST', path: '/api/auth/logout', description: 'User logout', status: 'implemented' },
        { method: 'POST', path: '/api/auth/refresh', description: 'Refresh token', status: 'planned' },
      ],
    },
    {
      name: 'Projects',
      id: 'projects',
      endpoints: [
        { method: 'GET', path: '/api/projects', description: 'List all projects', responseBody: '{ projects[] }', status: 'implemented' },
        { method: 'POST', path: '/api/projects', description: 'Create project', requestBody: '{ name, description }', responseBody: '{ project }', status: 'implemented' },
        { method: 'GET', path: '/api/projects/:id', description: 'Get project details', responseBody: '{ project }', status: 'implemented' },
        { method: 'PUT', path: '/api/projects/:id', description: 'Update project', requestBody: '{ name, description }', status: 'implemented' },
        { method: 'DELETE', path: '/api/projects/:id', description: 'Delete project', status: 'planned' },
      ],
    },
    {
      name: 'Requirements',
      id: 'requirements',
      endpoints: [
        { method: 'GET', path: '/api/projects/:id/requirements', description: 'List requirements', status: 'implemented' },
        { method: 'POST', path: '/api/projects/:id/requirements', description: 'Create requirement', status: 'implemented' },
        { method: 'PUT', path: '/api/requirements/:id', description: 'Update requirement', status: 'planned' },
      ],
    },
  ];

  const methodColors: Record<string, string> = {
    GET: 'bg-blue-900/30 text-blue-300 border-blue-600/50',
<<<<<<< HEAD
    POST: 'bg-blue-100 text-blue-700 border-blue-300',
    PUT: 'bg-amber-100 text-amber-700 border-amber-300',
    DELETE: 'bg-red-100 text-red-700 border-red-300',
    PATCH: 'bg-purple-100 text-purple-700 border-purple-300',
=======
    POST: 'bg-blue-800/40 text-blue-200 border-blue-600/50',
    PUT: 'bg-orange-900/30 text-orange-300 border-orange-600/50',
    DELETE: 'bg-red-900/30 text-red-300 border-red-600/50',
    PATCH: 'bg-purple-900/30 text-purple-300 border-purple-600/50',
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    complete: { bg: 'bg-blue-900/30', text: 'text-blue-300' },
<<<<<<< HEAD
    partial: { bg: 'bg-amber-100', text: 'text-amber-700' },
    empty: { bg: 'bg-gray-100', text: 'text-gray-500' },
=======
    partial: { bg: 'bg-orange-900/30', text: 'text-orange-300' },
    empty: { bg: 'bg-[var(--brand-700)]', text: 'text-gray-400' },
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(200, Math.max(25, prev + delta)));
  };

  const resetView = () => {
    setZoomLevel(100);
  };

  return (
    <div className="space-y-6">
      {/* Diagram Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {diagrams.map((diagram) => {
          const colors = statusColors[diagram.status];
          const isSelected = selectedDiagram === diagram.id;
          return (
            <button
              key={diagram.id}
              onClick={() => setSelectedDiagram(diagram.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
<<<<<<< HEAD
                  ? 'border-red-400 bg-red-50 shadow-lg scale-105'
                  : 'border-[var(--brand-700)] hover:border-gray-300 hover:bg-gray-50'
=======
                  ? 'border-blue-500/60 bg-blue-900/20 shadow-lg scale-105'
                  : 'border-[var(--brand-700)] hover:border-blue-700/60 hover:bg-[var(--brand-800)]'
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
              }`}
            >
              <div className={`p-2 rounded-lg ${colors.bg} w-fit mb-2`}>
                <span className={colors.text}>{diagram.icon}</span>
              </div>
              <h4 className="font-medium text-gray-200 text-sm">{diagram.name}</h4>
              <p className="text-xs text-gray-400 mt-1">{diagram.description}</p>
              <Badge
                variant={diagram.status === 'complete' ? 'success' : diagram.status === 'partial' ? 'warning' : 'secondary'}
                className="mt-2"
              >
                {diagram.status}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Diagram Canvas */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-[var(--brand-850)] border-b border-[var(--brand-700)] flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Layers className="h-5 w-5 text-blue-400" />
              {diagrams.find((d) => d.id === selectedDiagram)?.name || 'Select a Diagram'}
            </CardTitle>
            <CardDescription>
              {diagrams.find((d) => d.id === selectedDiagram)?.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-[var(--brand-850)] border border-[var(--brand-700)] rounded-lg px-2 py-1">
              <Button variant="ghost" size="sm" onClick={() => handleZoom(-25)} disabled={zoomLevel <= 25}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">{zoomLevel}%</span>
              <Button variant="ghost" size="sm" onClick={() => handleZoom(25)} disabled={zoomLevel >= 200}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleMaximize}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadDiagram}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={diagramRef}
            className="relative overflow-auto bg-[#152238]"
            style={{ height: '500px' }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center p-8 transition-transform origin-center"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              {/* Sample Architecture Diagram Visualization */}
              {selectedDiagram === 'architecture' && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border max-w-4xl">
                  <div className="space-y-6">
                    {/* Client Layer */}
                    <div className="text-center">
                      <div className="inline-block px-6 py-3 bg-blue-100 rounded-xl border-2 border-blue-300">
                        <span className="font-medium text-blue-700">🌐 Client Layer</span>
                        <div className="flex gap-3 mt-2">
                          <span className="px-2 py-1 bg-white rounded text-xs">Web App</span>
                          <span className="px-2 py-1 bg-white rounded text-xs">Mobile App</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="w-px h-8 bg-gray-300" />
                    </div>

                    {/* API Gateway */}
                    <div className="text-center">
                      <div className="inline-block px-6 py-3 bg-amber-100 rounded-xl border-2 border-amber-300">
                        <span className="font-medium text-amber-700">🚪 API Gateway</span>
                        <div className="flex gap-2 mt-2 text-xs">
                          <span className="px-2 py-1 bg-white rounded">Auth</span>
                          <span className="px-2 py-1 bg-white rounded">Rate Limit</span>
                          <span className="px-2 py-1 bg-white rounded">Load Balance</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="w-px h-8 bg-gray-300" />
                    </div>

                    {/* Services Layer */}
                    <div className="flex justify-center gap-4">
                      {['User Service', 'Project Service', 'AI Service', 'Notification'].map((service) => (
                        <div key={service} className="px-4 py-3 bg-blue-900/30 rounded-xl border-2 border-blue-600/50">
                          <span className="font-medium text-blue-300 text-sm">⚙️ {service}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-center gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-px h-8 bg-gray-300" />
                      ))}
                    </div>

                    {/* Data Layer */}
                    <div className="flex justify-center gap-4">
                      <div className="px-4 py-3 bg-purple-100 rounded-xl border-2 border-purple-300">
                        <span className="font-medium text-purple-700 text-sm">🗄️ PostgreSQL</span>
                      </div>
                      <div className="px-4 py-3 bg-red-100 rounded-xl border-2 border-red-300">
                        <span className="font-medium text-red-700 text-sm">⚡ Redis Cache</span>
                      </div>
                      <div className="px-4 py-3 bg-cyan-100 rounded-xl border-2 border-cyan-300">
                        <span className="font-medium text-cyan-700 text-sm">📦 S3 Storage</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ERD Visualization */}
              {selectedDiagram === 'erd' && (
                <div className="bg-white p-8 rounded-2xl shadow-lg border">
                  <div className="flex gap-8">
                    {/* Users Table */}
                    <div className="border-2 border-blue-600/50 rounded-lg overflow-hidden">
                      <div className="bg-blue-900/30 px-4 py-2 font-medium text-blue-300">👤 Users</div>
                      <div className="p-3 space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500">🔑</span> id (PK)
                        </div>
                        <div>email</div>
                        <div>password_hash</div>
                        <div>created_at</div>
                      </div>
                    </div>

                    {/* Projects Table */}
                    <div className="border-2 border-blue-300 rounded-lg overflow-hidden">
                      <div className="bg-blue-100 px-4 py-2 font-medium text-blue-700">📁 Projects</div>
                      <div className="p-3 space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500">🔑</span> id (PK)
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-500">🔗</span> user_id (FK)
                        </div>
                        <div>name</div>
                        <div>description</div>
                        <div>created_at</div>
                      </div>
                    </div>

                    {/* Requirements Table */}
                    <div className="border-2 border-purple-300 rounded-lg overflow-hidden">
                      <div className="bg-purple-100 px-4 py-2 font-medium text-purple-700">📋 Requirements</div>
                      <div className="p-3 space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500">🔑</span> id (PK)
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-500">🔗</span> project_id (FK)
                        </div>
                        <div>title</div>
                        <div>type</div>
                        <div>priority</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State for other diagrams */}
              {!['architecture', 'erd'].includes(selectedDiagram || '') && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    {diagrams.find((d) => d.id === selectedDiagram)?.icon}
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">No diagram yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Generate this diagram with AI or create it manually</p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={() => onGenerate(`Generate ${selectedDiagram} diagram`)} disabled={isGenerating}>
                      {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Generate with AI
                    </Button>
                    <Button variant="outline" onClick={onOpenCanvas}>
                      <Plus className="mr-2 h-4 w-4" />
                      Open Canvas
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open Canvas Button */}
      <Card className="bg-blue-900/20 border-blue-700/40">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Visual Diagram Editor</h3>
            <p className="text-sm text-gray-400">Create and edit diagrams in the full canvas view</p>
          </div>
          <Button onClick={onOpenCanvas} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Canvas Studio
          </Button>
        </CardContent>
      </Card>

      {/* API Contract Table */}
      <Card>
        <CardHeader className="bg-[var(--brand-850)] border-b border-[var(--brand-700)]">
          <CardTitle className="flex items-center gap-2 text-white">
            <FileJson className="h-5 w-5 text-blue-400" />
            API Contract Table
          </CardTitle>
          <CardDescription className="text-gray-400">REST API endpoints and their specifications</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {apiGroups.map((group) => {
            const isExpanded = expandedApi.has(group.id);
            return (
              <div key={group.id} className="border-b border-[var(--brand-700)] last:border-b-0">
                <button
                  onClick={() => {
                    setExpandedApi((prev) => {
                      const next = new Set(prev);
                      if (next.has(group.id)) next.delete(group.id);
                      else next.add(group.id);
                      return next;
                    });
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--brand-800)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Server className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-200">{group.name}</span>
                    <Badge variant="secondary">{group.endpoints.length} endpoints</Badge>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>

                {isExpanded && (
                  <div className="bg-[var(--brand-850)] border-t border-[var(--brand-700)]">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--brand-800)]">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-400">Method</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-400">Endpoint</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-400">Description</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-400">Request</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-400">Response</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-400">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.endpoints.map((endpoint, idx) => (
<<<<<<< HEAD
                          <tr key={idx} className="border-t border-[var(--brand-700)] hover:bg-white">
=======
                          <tr key={idx} className="border-t border-[var(--brand-700)] hover:bg-[var(--brand-800)]">
>>>>>>> 06ab8cc70568499c9e8ea30b7f8b9591269255d1
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${methodColors[endpoint.method]}`}>
                                {endpoint.method}
                              </span>
                            </td>
                            <td className="px-4 py-2 font-mono text-xs text-blue-300">{endpoint.path}</td>
                            <td className="px-4 py-2 text-gray-300">{endpoint.description}</td>
                            <td className="px-4 py-2 font-mono text-xs text-gray-400">{endpoint.requestBody || '-'}</td>
                            <td className="px-4 py-2 font-mono text-xs text-gray-400">{endpoint.responseBody || '-'}</td>
                            <td className="px-4 py-2">
                              <Badge variant={endpoint.status === 'implemented' ? 'success' : endpoint.status === 'planned' ? 'warning' : 'destructive'}>
                                {endpoint.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* AI Generate Section */}
      <Card className="bg-blue-900/20 border-blue-700/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-blue-400" />
            AI Design Assistant
          </CardTitle>
          <CardDescription className="text-gray-400">Generate diagrams and design artifacts with AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" onClick={() => onGenerate('Generate complete system architecture diagram')}>
              <Layers className="mr-2 h-4 w-4" /> Architecture
            </Button>
            <Button variant="outline" onClick={() => onGenerate('Generate database ERD with all entities')}>
              <Database className="mr-2 h-4 w-4" /> ERD
            </Button>
            <Button variant="outline" onClick={() => onGenerate('Generate sequence diagram for user authentication flow')}>
              <ArrowRight className="mr-2 h-4 w-4" /> Sequence
            </Button>
            <Button variant="outline" onClick={() => onGenerate('Generate API contract documentation')}>
              <FileJson className="mr-2 h-4 w-4" /> API Docs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader className="bg-[var(--brand-850)] border-b border-[var(--brand-700)]">
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle2 className="h-5 w-5 text-blue-400" />
            Design Phase Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-700/40">
              <div className="text-2xl font-bold text-blue-300">
                {diagrams.filter((d) => d.status === 'complete').length}
              </div>
              <div className="text-sm text-blue-400">Diagrams Complete</div>
            </div>
            <div className="p-4 bg-orange-900/20 rounded-xl border border-orange-700/40">
              <div className="text-2xl font-bold text-orange-300">
                {diagrams.filter((d) => d.status === 'partial').length}
              </div>
              <div className="text-sm text-orange-400">In Progress</div>
            </div>
            <div className="p-4 bg-[var(--brand-750,#152238)] rounded-xl border border-[var(--brand-700)]">
              <div className="text-2xl font-bold text-gray-200">
                {apiGroups.reduce((a, g) => a + g.endpoints.filter((e) => e.status === 'implemented').length, 0)}
              </div>
              <div className="text-sm text-gray-400">APIs Implemented</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemDesignPhase;
