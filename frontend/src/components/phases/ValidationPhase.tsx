import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  FileCheck,
  Shield,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  Target,
} from 'lucide-react';

interface ValidationItem {
  id: string;
  type: 'requirement' | 'prototype' | 'risk' | 'stakeholder';
  name: string;
  description: string;
  status: 'approved' | 'pending' | 'rejected' | 'review';
  reviewer?: string;
  comments?: string;
  date?: string;
}

interface ValidationPhaseProps {
  projectId: string;
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  content: string;
}

const parseValidationItems = (markdown: string): ValidationItem[] => {
  if (!markdown.trim()) return [];
  const lines = markdown.split('\n');
  const items: ValidationItem[] = [];
  let currentType: ValidationItem['type'] = 'stakeholder';
  let counter = 1;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const lower = line.toLowerCase();

    if (line.startsWith('#')) {
      if (lower.includes('stakeholder')) currentType = 'stakeholder';
      else if (lower.includes('requirement')) currentType = 'requirement';
      else if (lower.includes('prototype') || lower.includes('prototype')) currentType = 'prototype';
      else if (lower.includes('risk')) currentType = 'risk';
      continue;
    }

    if (!line.startsWith('-') && !line.startsWith('*')) continue;
    const content = line.replace(/^[-*]\s*/, '').trim();
    if (!content) continue;

    const [namePart, descPart] = content.split(':');
    const name = (namePart || '').trim() || `Item ${counter}`;
    const description = (descPart || '').trim() || name;

    const idPrefix =
      currentType === 'stakeholder'
        ? 's'
        : currentType === 'requirement'
        ? 'r'
        : currentType === 'prototype'
        ? 'p'
        : 'k';

    items.push({
      id: `${idPrefix}${counter}`,
      type: currentType,
      name,
      description,
      status: 'pending',
    });
    counter += 1;
  }

  return items;
};

export const ValidationPhase: React.FC<ValidationPhaseProps> = ({
  projectId,
  onGenerate,
  isGenerating,
  content,
}) => {
  const [activeTab, setActiveTab] = useState<'stakeholder' | 'requirements' | 'prototype' | 'risks'>('stakeholder');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const initialItems = parseValidationItems(content);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
      case 'pending':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      case 'review':
        return <Badge variant="secondary" className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> In Review</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Local editable state for all items parsed from AI content
  const [itemsById, setItemsById] = useState<Record<string, ValidationItem>>(() => {
    const map: Record<string, ValidationItem> = {};
    initialItems.forEach((item) => {
      map[item.id] = { ...item };
    });
    return map;
  });

  const getItemsByType = (type: ValidationItem['type']) =>
    Object.values(itemsById).filter((i) => i.type === type);

  const getValidationItems = () => {
    switch (activeTab) {
      case 'stakeholder':
        return getItemsByType('stakeholder');
      case 'requirements':
        return getItemsByType('requirement');
      case 'prototype':
        return getItemsByType('prototype');
      case 'risks':
        return getItemsByType('risk');
      default:
        return [];
    }
  };

  const getStats = (items: ValidationItem[]) => {
    const approved = items.filter(i => i.status === 'approved').length;
    const pending = items.filter(i => i.status === 'pending').length;
    const review = items.filter(i => i.status === 'review').length;
    const rejected = items.filter(i => i.status === 'rejected').length;
    return { approved, pending, review, rejected, total: items.length };
  };

  const overallStats = getStats(Object.values(itemsById));
  const overallProgress = Math.round((overallStats.approved / overallStats.total) * 100);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-teal-700">{overallProgress}%</div>
            <div className="text-sm text-teal-600">Overall Validated</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{overallStats.approved}</div>
            <div className="text-sm text-gray-500">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{overallStats.pending}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{overallStats.review}</div>
            <div className="text-sm text-gray-500">In Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{overallStats.rejected}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Tabs */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTab === 'stakeholder' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('stakeholder')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Stakeholder Sign-off
              <Badge variant="secondary" className="ml-1">{getItemsByType('stakeholder').length}</Badge>
            </Button>
            <Button
              variant={activeTab === 'requirements' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('requirements')}
              className="flex items-center gap-2"
            >
              <FileCheck className="h-4 w-4" />
              Requirements
              <Badge variant="secondary" className="ml-1">{getItemsByType('requirement').length}</Badge>
            </Button>
            <Button
              variant={activeTab === 'prototype' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('prototype')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Prototype
              <Badge variant="secondary" className="ml-1">{getItemsByType('prototype').length}</Badge>
            </Button>
            <Button
              variant={activeTab === 'risks' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('risks')}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Risk Confirmation
              <Badge variant="secondary" className="ml-1">{getItemsByType('risk').length}</Badge>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getValidationItems().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No validation items parsed from AI output yet.</p>
                <p className="text-sm mt-1">Run the Validation phase AI to generate a checklist.</p>
              </div>
            )}
            {getValidationItems().map((item) => {
              const liveItem = itemsById[item.id] || item;
              const isExpanded = expandedItems.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`border rounded-lg transition-all ${
                    liveItem.status === 'approved' ? 'border-emerald-200 bg-emerald-50/50' :
                    liveItem.status === 'pending' ? 'border-amber-200 bg-amber-50/50' :
                    liveItem.status === 'rejected' ? 'border-red-200 bg-red-50/50' :
                    'border-gray-200 bg-white'
                  }`}
                >
                  <div
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div className="flex items-center gap-3">
                      {liveItem.status === 'approved' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : liveItem.status === 'pending' ? (
                        <Clock className="h-5 w-5 text-amber-500" />
                      ) : liveItem.status === 'rejected' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(liveItem.status)}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t pt-3 space-y-3">
                      {liveItem.reviewer && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Reviewer:</span>
                          <span className="font-medium">{liveItem.reviewer}</span>
                        </div>
                      )}
                      {liveItem.date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Date:</span>
                          <span className="font-medium">{liveItem.date}</span>
                        </div>
                      )}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-start gap-2 text-sm">
                          <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-gray-600">Reviewer comments</span>
                            <textarea
                              className="mt-1 w-full border border-gray-200 rounded-md px-2 py-1 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                              rows={2}
                              value={liveItem.comments || ''}
                              onChange={(e) =>
                                setItemsById((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    comments: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Add validation notes or rationale..."
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={() =>
                              setItemsById((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  status: 'approved',
                                },
                              }))
                            }
                          >
                            <ThumbsUp className="h-3 w-3" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1 text-red-600"
                            onClick={() =>
                              setItemsById((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  status: 'rejected',
                                },
                              }))
                            }
                          >
                            <ThumbsDown className="h-3 w-3" /> Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Validation Assistant */}
      <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-600" />
            AI Validation Assistant
          </CardTitle>
          <CardDescription>Get AI help with validation tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGenerate('Generate a comprehensive validation checklist for all requirements')}
              disabled={isGenerating}
              className="h-auto py-3 flex flex-col items-center gap-2"
            >
              <FileCheck className="h-5 w-5 text-teal-600" />
              <span className="text-xs">Generate Checklist</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGenerate('Identify gaps in stakeholder sign-offs and suggest next steps')}
              disabled={isGenerating}
              className="h-auto py-3 flex flex-col items-center gap-2"
            >
              <Users className="h-5 w-5 text-teal-600" />
              <span className="text-xs">Sign-off Analysis</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGenerate('Analyze risks and suggest additional mitigations')}
              disabled={isGenerating}
              className="h-auto py-3 flex flex-col items-center gap-2"
            >
              <AlertTriangle className="h-5 w-5 text-teal-600" />
              <span className="text-xs">Risk Analysis</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGenerate('Create a validation summary report for stakeholders')}
              disabled={isGenerating}
              className="h-auto py-3 flex flex-col items-center gap-2"
            >
              <Target className="h-5 w-5 text-teal-600" />
              <span className="text-xs">Summary Report</span>
            </Button>
          </div>
          {isGenerating && (
            <div className="flex items-center justify-center gap-2 text-teal-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI is analyzing...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ValidationPhase;
