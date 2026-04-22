import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Requirement } from '@/types';
import { api } from '@/lib/api';
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  Users,
  Loader2,
} from 'lucide-react';

interface ValidationItem {
  id: string;
  requirementId?: string;
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
  requirements?: Requirement[];
}

const buildRequirementItems = (requirements?: Requirement[]): ValidationItem[] => {
  if (!requirements || !requirements.length) return [];
  let counter = 1;
  return requirements.map((req) => ({
    id: `r${counter++}`,
    requirementId: req.requirement_id,
    name: req.title,
    description: req.description,
    status: (req.status === 'approved' || req.status === 'rejected' || req.status === 'review')
      ? req.status as ValidationItem['status']
      : 'pending',
  }));
};

export const ValidationPhase: React.FC<ValidationPhaseProps> = ({
  projectId,
  onGenerate,
  isGenerating,
  content,
  requirements,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const initialItems = buildRequirementItems(requirements);

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

  const [savingId, setSavingId] = useState<string | null>(null);

  // Local editable state for all items parsed from AI content
  const [itemsById, setItemsById] = useState<Record<string, ValidationItem>>(() => {
    const map: Record<string, ValidationItem> = {};
    initialItems.forEach((item) => {
      map[item.id] = { ...item };
    });
    return map;
  });

  const handleSetStatus = async (itemId: string, status: 'approved' | 'rejected') => {
    const item = itemsById[itemId];
    setItemsById((prev) => ({ ...prev, [itemId]: { ...prev[itemId], status } }));
    if (!item?.requirementId) return;
    setSavingId(itemId);
    try {
      await api.updateRequirement(item.requirementId, { status });
    } catch (err) {
      console.error('Failed to persist validation status', err);
      setItemsById((prev) => ({ ...prev, [itemId]: { ...prev[itemId], status: item.status } }));
      window.location.reload();
    } finally {
      setSavingId(null);
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
  const overallProgress = overallStats.total > 0 ? Math.round((overallStats.approved / overallStats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-blue-900/20 border-blue-700/40">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-300">{overallProgress}%</div>
            <div className="text-sm text-blue-400">Overall Validated</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{overallStats.approved}</div>
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
      {/* Requirements Validation List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.values(itemsById).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No requirements found to validate.</p>
                <p className="text-sm mt-1">Generate or sync requirements first.</p>
              </div>
            )}
            {Object.values(itemsById).map((item) => {
              const liveItem = itemsById[item.id] || item;
              const isExpanded = expandedItems.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`border rounded-lg transition-all ${liveItem.status === 'approved' ? 'border-blue-700/40 bg-blue-900/20' :
                      liveItem.status === 'pending' ? 'border-amber-700/40 bg-amber-900/10' :
                        liveItem.status === 'rejected' ? 'border-red-700/40 bg-red-900/10' :
                          'border-[var(--brand-700)] bg-[var(--brand-850)]'
                    }`}
                >
                  <div
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div className="flex items-center gap-3">
                      {liveItem.status === 'approved' ? (
                        <CheckCircle2 className="h-5 w-5 text-blue-400" />
                      ) : liveItem.status === 'pending' ? (
                        <Clock className="h-5 w-5 text-amber-500" />
                      ) : liveItem.status === 'rejected' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                      )}
                      <div>
                        <div className="font-medium text-gray-200">{item.name}</div>
                        <div className="text-sm text-gray-400">{item.description}</div>
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
                            <span className="text-gray-400">Reviewer comments</span>
                            <textarea
                              className="mt-1 w-full border border-[var(--brand-700)] rounded-md px-2 py-1 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-[#152238] text-gray-200 placeholder-gray-500"
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
                            disabled={savingId === item.id}
                            onClick={() => handleSetStatus(item.id, 'approved')}
                          >
                            {savingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ThumbsUp className="h-3 w-3" />
                            )}{' '}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1 text-red-600"
                            disabled={savingId === item.id}
                            onClick={() => handleSetStatus(item.id, 'rejected')}
                          >
                            {savingId === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ThumbsDown className="h-3 w-3" />
                            )}{' '}
                            Reject
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
    </div>
  );
};

export default ValidationPhase;
