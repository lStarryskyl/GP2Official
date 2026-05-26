import React, { useState } from 'react';
import { ScaffoldResult, ScaffoldFile, api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { FileCode2, Copy, Download, Terminal, CheckCircle2, ChevronRight, ChevronDown } from 'lucide-react';

interface ScaffoldPanelProps {
  scaffold: ScaffoldResult;
}

export const ScaffoldPanel: React.FC<ScaffoldPanelProps> = ({ scaffold }) => {
  const [selectedFile, setSelectedFile] = useState<ScaffoldFile | null>(scaffold.files[0] || null);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadAll = () => {
    // In a real implementation this would generate a ZIP using jszip
    // For now, we'll just alert that this requires a ZIP library
    alert("ZIP download requires additional frontend libraries (e.g. jszip). Please copy files individually for now.");
  };

  // Process files into a tree structure for the sidebar
  const buildTree = (files: ScaffoldFile[]) => {
    const tree: any = {};
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          current[part] = file;
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      }
    });
    return tree;
  };

  const fileTree = buildTree(scaffold.files);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const renderTree = (node: any, currentPath = '', level = 0) => {
    return Object.entries(node).map(([key, value]) => {
      const fullPath = currentPath ? `${currentPath}/${key}` : key;
      const isFile = value && typeof value === 'object' && 'content' in value;

      if (isFile) {
        const file = value as ScaffoldFile;
        const isSelected = selectedFile?.path === file.path;
        return (
          <button
            key={fullPath}
            onClick={() => setSelectedFile(file)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors ${
              isSelected ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
            }`}
            style={{ paddingLeft: `${(level + 1) * 0.75}rem` }}
          >
            <FileCode2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`} />
            <span className="truncate">{key}</span>
          </button>
        );
      }

      // It's a folder
      const isExpanded = expandedFolders[fullPath] !== false; // Default expanded
      return (
        <div key={fullPath}>
          <button
            onClick={() => toggleFolder(fullPath)}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded transition-colors"
            style={{ paddingLeft: `${level * 0.75}rem` }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
            )}
            <span className="truncate">{key}</span>
          </button>
          
          {isExpanded && (
            <div className="mt-0.5">
              {renderTree(value, fullPath, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-500" />
            Generated {scaffold.target_stack} Scaffold
          </h3>
          <p className="text-sm text-slate-500">
            {scaffold.files.length} files generated • {scaffold.tokens_used.toLocaleString()} tokens
          </p>
        </div>
        <Button
          onClick={handleDownloadAll}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Project
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row h-[600px] divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* File Tree Sidebar */}
        <div className="w-full lg:w-64 shrink-0 bg-slate-50 overflow-y-auto p-3">
          <div className="mb-2 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">PROJECT FILES</div>
          <div className="space-y-0.5">
            {renderTree(fileTree)}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {selectedFile ? (
            <>
              {/* File Header */}
              <div className="h-12 border-b border-slate-200 flex items-center justify-between px-4 shrink-0 bg-white">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="text-sm font-medium text-slate-700 truncate">{selectedFile.path}</span>
                  {selectedFile.description && (
                    <span className="text-xs text-slate-400 truncate hidden sm:inline-block border-l border-slate-200 pl-2 ml-1">
                      {selectedFile.description}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => handleCopy(selectedFile.content, 'file')}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors shrink-0 tooltip-trigger"
                  title="Copy file content"
                >
                  {copied === 'file' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Code Preview */}
              <div className="flex-1 overflow-auto bg-slate-900 text-slate-300 p-4 relative group">
                <pre className="text-[13px] leading-relaxed font-mono">
                  <code>{selectedFile.content}</code>
                </pre>
              </div>
            </>
          ) : (
             <div className="flex-1 flex items-center justify-center flex-col text-slate-400">
               <FileCode2 className="w-12 h-12 mb-3 text-slate-200" />
               <p>Select a file to view its contents</p>
             </div>
          )}
        </div>
      </div>

      {/* Setup Instructions Footer */}
      <div className="border-t border-slate-200 bg-slate-50 p-6">
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-500" />
          Setup Instructions
        </h4>
        <div className="bg-slate-900 rounded-xl p-4 text-slate-300 font-mono text-sm overflow-x-auto relative">
           <button
             onClick={() => handleCopy(scaffold.setup_instructions, 'setup')}
             className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-white/10 text-slate-400 transition-colors"
             title="Copy setup instructions"
           >
             {copied === 'setup' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
           </button>
           <pre className="whitespace-pre-wrap">{scaffold.setup_instructions}</pre>
        </div>
      </div>
    </div>
  );
};
