import React, { useState } from 'react';
import { Network, Link as LinkIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TraceabilityMatrixProps {
  requirements: Array<{ id: string; title: string; type: string }>;
  tasks: Array<{ id: string; title: string; status: string }>;
  links: Array<{
    source_id: string;
    target_id: string;
    link_type: string;
  }>;
  coveragePercentage: number;
  onCreateLink: (sourceId: string, targetId: string) => void;
}

export const TraceabilityMatrix: React.FC<TraceabilityMatrixProps> = ({
  requirements,
  tasks,
  links,
  coveragePercentage,
  onCreateLink
}) => {
  const [selectedReq, setSelectedReq] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const isLinked = (reqId: string, taskId: string) => {
    return links.some(
      link => link.source_id === reqId && link.target_id === taskId
    );
  };

  const getLinkedTasks = (reqId: string) => {
    return links
      .filter(link => link.source_id === reqId)
      .map(link => link.target_id);
  };

  const handleCellClick = (reqId: string, taskId: string) => {
    if (!isLinked(reqId, taskId)) {
      onCreateLink(reqId, taskId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-acorn-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-acorn-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Network className="w-6 h-6 text-acorn-blue-600" />
            <h3 className="text-xl font-bold text-acorn-gray-900">Traceability Matrix</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-acorn-gray-600">Coverage</p>
              <p className="text-2xl font-bold text-acorn-blue-600">{coveragePercentage}%</p>
            </div>
            {coveragePercentage < 80 && (
              <AlertTriangle className="w-6 h-6 text-acorn-orange-500" />
            )}
            {coveragePercentage >= 80 && (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            )}
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-acorn-gray-50">
              <th className="sticky left-0 bg-acorn-gray-50 p-4 text-left text-sm font-semibold text-acorn-gray-700 border-r border-acorn-gray-200">
                Requirements
              </th>
              {tasks.map(task => (
                <th
                  key={task.id}
                  className="p-4 text-left text-xs font-medium text-acorn-gray-600 min-w-[150px]"
                >
                  <div className="truncate" title={task.title}>
                    {task.title}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requirements.map((req, reqIdx) => {
              const linkedTaskIds = getLinkedTasks(req.id);
              const hasLinks = linkedTaskIds.length > 0;

              return (
                <tr
                  key={req.id}
                  className={`border-t border-acorn-gray-200 ${
                    reqIdx % 2 === 0 ? 'bg-white' : 'bg-acorn-gray-50'
                  }`}
                >
                  <td className="sticky left-0 bg-inherit p-4 border-r border-acorn-gray-200">
                    <div className="flex items-center gap-2">
                      {!hasLinks && (
                        <AlertTriangle className="w-4 h-4 text-acorn-orange-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-acorn-gray-900 text-sm">{req.title}</p>
                        <p className="text-xs text-acorn-gray-500">{req.type}</p>
                      </div>
                    </div>
                  </td>
                  {tasks.map(task => {
                    const linked = isLinked(req.id, task.id);
                    return (
                      <td
                        key={task.id}
                        className="p-4 text-center cursor-pointer hover:bg-acorn-blue-50 transition-colors"
                        onClick={() => handleCellClick(req.id, task.id)}
                      >
                        {linked ? (
                          <div className="flex items-center justify-center">
                            <LinkIcon className="w-5 h-5 text-acorn-blue-600" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center opacity-0 hover:opacity-100">
                            <div className="w-5 h-5 border-2 border-dashed border-acorn-gray-300 rounded" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="p-6 border-t border-acorn-gray-200 bg-acorn-gray-50">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-acorn-blue-600" />
            <span className="text-acorn-gray-700">Linked</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-acorn-orange-500" />
            <span className="text-acorn-gray-700">No links (orphaned)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-dashed border-acorn-gray-300 rounded" />
            <span className="text-acorn-gray-700">Click to link</span>
          </div>
        </div>
      </div>
    </div>
  );
};
