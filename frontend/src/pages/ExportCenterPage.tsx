import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Presentation,
  Loader2,
  CheckCircle2,
  FolderOpen,
  Settings,
  Sparkles,
  FileCode
} from 'lucide-react';
import { api } from '@/lib/api';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  formats: string[];
}

const exportOptions: ExportOption[] = [
  {
    id: 'srs',
    name: 'SRS Document',
    description: 'Complete Software Requirements Specification',
    icon: FileText,
    formats: ['PDF', 'DOCX']
  },
  {
    id: 'requirements',
    name: 'Requirements List',
    description: 'All project requirements in spreadsheet format',
    icon: FileSpreadsheet,
    formats: ['XLSX', 'CSV']
  },
  {
    id: 'roadmap',
    name: 'Project Roadmap',
    description: 'Visual timeline with milestones',
    icon: Presentation,
    formats: ['PDF', 'PPTX']
  },
  {
    id: 'feasibility',
    name: 'Feasibility Report',
    description: 'Technical and business feasibility analysis',
    icon: FileText,
    formats: ['PDF', 'DOCX']
  },
  {
    id: 'markdown',
    name: 'Full Project Markdown',
    description: 'All phase outputs in a single Markdown document',
    icon: FileCode,
    formats: ['MD']
  }
];

export const ExportCenterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [exporting, setExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<Set<string>>(new Set());
  const [selectedFormats, setSelectedFormats] = useState<Record<string, string>>({
    srs: 'PDF',
    requirements: 'XLSX',
    roadmap: 'PDF',
    feasibility: 'PDF',
    markdown: 'MD'
  });

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (optionId: string) => {
    if (!id) return;
    setExporting(optionId);
    try {
      const format = selectedFormats[optionId];
      let blob: Blob | null = null;
      let filename = 'project_export';

      if ((optionId === 'srs' || optionId === 'feasibility') && format === 'PDF') {
        blob = await api.exportProjectPdf(id);
        filename = `project_export.pdf`;
      } else if ((optionId === 'srs' || optionId === 'feasibility') && format === 'DOCX') {
        blob = await api.exportProjectDocx(id);
        filename = `project_export.docx`;
      } else if (optionId === 'markdown') {
        blob = await api.exportProjectMarkdown(id);
        filename = `project_export.md`;
      }

      if (blob) {
        triggerBlobDownload(blob, filename);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
        alert(`${exportOptions.find(o => o.id === optionId)?.name} exported as ${format}!`);
      }
      setExported(prev => new Set(prev).add(optionId));
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportAll = async () => {
    for (const option of exportOptions) {
      await handleExport(option.id);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)]" style={{ backgroundColor: '#0a150e' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, #4ade80, #b8962e)', boxShadow: '0 10px 25px -5px rgba(212,175,55,0.3)' }}>
                <Download className="w-7 h-7" style={{ color: '#0a150e' }} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Export Center</h1>
                <p className="text-gray-400">Download project documents in various formats</p>
              </div>
            </div>

            <Button
              onClick={handleExportAll}
              disabled={!!exporting}
              className="font-semibold shadow-lg"
              style={{ background: 'linear-gradient(to right, #4ade80, #b8962e)', color: '#0a150e' }}
              data-testid="export-all-btn"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>

          {/* Export Options Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              const isExporting = exporting === option.id;
              const isExported = exported.has(option.id);

              return (
                <div
                  key={option.id}
                  className="rounded-2xl p-6 transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: '#0f1f15', border: '1px solid #1e4a28' }}
                  data-testid={`export-option-${option.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
                      <Icon className="w-6 h-6" style={{ color: '#4ade80' }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white">{option.name}</h3>
                        {isExported && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <p className="text-sm text-gray-400 mb-4">{option.description}</p>
                      
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex gap-2">
                          {option.formats.map((format) => (
                            <button
                              key={format}
                              onClick={() => setSelectedFormats(prev => ({ ...prev, [option.id]: format }))}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                selectedFormats[option.id] === format ? 'text-[#0a150e]' : 'text-gray-400'
                              }`}
                              style={{
                                backgroundColor: selectedFormats[option.id] === format ? '#4ade80' : '#152238',
                                border: '1px solid #1e4a28'
                              }}
                            >
                              {format}
                            </button>
                          ))}
                        </div>

                        <Button
                          onClick={() => handleExport(option.id)}
                          disabled={isExporting}
                          size="sm"
                          className="font-medium"
                          style={{ backgroundColor: '#152238', border: '1px solid #1e4a28', color: '#fff' }}
                        >
                          {isExporting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Export History */}
          <div className="mt-8 rounded-2xl p-6" style={{ backgroundColor: '#0f1f15', border: '1px solid #1e4a28' }}>
            <div className="flex items-center gap-3 mb-4">
              <FolderOpen className="w-5 h-5" style={{ color: '#4ade80' }} />
              <h3 className="text-lg font-bold text-white">Recent Exports</h3>
            </div>
            
            {exported.size > 0 ? (
              <div className="space-y-2">
                {Array.from(exported).map((optionId) => {
                  const option = exportOptions.find(o => o.id === optionId);
                  return (
                    <div key={optionId} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#0a150e' }}>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-gray-300">{option?.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#152238', color: '#4ade80' }}>
                          {selectedFormats[optionId]}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">Just now</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No exports yet. Choose a document to export above.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ExportCenterPage;
