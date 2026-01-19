import React, { useState } from 'react';
import { History, GitCompare, RotateCcw, User, Calendar } from 'lucide-react';
import { Button } from './ui/Button';

interface Version {
  id: string;
  version_number: number;
  change_summary: string;
  changed_by_name: string;
  created_at: string;
  changes: Record<string, any>;
}

interface VersionHistoryProps {
  versions: Version[];
  onCompare: (fromVersion: number, toVersion: number) => void;
  onRestore: (versionNumber: number) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  onCompare,
  onRestore
}) => {
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [showDiff, setShowDiff] = useState(false);

  const handleVersionSelect = (versionNumber: number) => {
    if (selectedVersions.includes(versionNumber)) {
      setSelectedVersions(selectedVersions.filter(v => v !== versionNumber));
    } else if (selectedVersions.length < 2) {
      setSelectedVersions([...selectedVersions, versionNumber]);
    }
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      const [v1, v2] = selectedVersions.sort((a, b) => a - b);
      onCompare(v1, v2);
      setShowDiff(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-acorn-gray-200">
      <div className="p-6 border-b border-acorn-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-acorn-blue-600" />
            <h3 className="text-xl font-bold text-acorn-gray-900">Version History</h3>
          </div>
          {selectedVersions.length === 2 && (
            <Button
              onClick={handleCompare}
              className="bg-acorn-orange-500 hover:bg-acorn-orange-600 text-white"
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Compare Versions
            </Button>
          )}
        </div>
        {selectedVersions.length > 0 && (
          <p className="text-sm text-acorn-gray-600 mt-2">
            {selectedVersions.length === 1
              ? 'Select one more version to compare'
              : 'Click "Compare Versions" to see differences'}
          </p>
        )}
      </div>

      <div className="divide-y divide-acorn-gray-200">
        {versions.map((version) => (
          <div
            key={version.id}
            className={`p-6 hover:bg-acorn-gray-50 transition-colors ${
              selectedVersions.includes(version.version_number)
                ? 'bg-acorn-blue-50 border-l-4 border-acorn-blue-500'
                : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-acorn-blue-100 text-acorn-blue-700 rounded-full text-sm font-semibold">
                    v{version.version_number}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-acorn-gray-600">
                    <User className="w-4 h-4" />
                    <span>{version.changed_by_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-acorn-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(version.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-acorn-gray-700">{version.change_summary}</p>
                {Object.keys(version.changes).length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-acorn-gray-500">
                      {Object.keys(version.changes).length} field(s) changed
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleVersionSelect(version.version_number)}
                  className={
                    selectedVersions.includes(version.version_number)
                      ? 'border-acorn-blue-500 text-acorn-blue-600'
                      : ''
                  }
                >
                  {selectedVersions.includes(version.version_number) ? 'Selected' : 'Select'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRestore(version.version_number)}
                  className="border-acorn-orange-500 text-acorn-orange-600 hover:bg-acorn-orange-50"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Restore
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {versions.length === 0 && (
        <div className="p-12 text-center">
          <History className="w-12 h-12 text-acorn-gray-400 mx-auto mb-4" />
          <p className="text-acorn-gray-600">No version history available</p>
        </div>
      )}
    </div>
  );
};
