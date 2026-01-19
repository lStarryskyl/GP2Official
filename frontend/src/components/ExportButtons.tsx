import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface ExportButtonsProps {
  projectId: string;
  projectName?: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ projectId, projectName = 'project' }) => {
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingDOCX, setExportingDOCX] = useState(false);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const blob = await api.exportProjectPdf(projectId);
      downloadBlob(blob, `${projectName}-export.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportDOCX = async () => {
    setExportingDOCX(true);
    try {
      const blob = await api.exportProjectDocx(projectId);
      downloadBlob(blob, `${projectName}-export.docx`);
    } catch (error) {
      console.error('Failed to export DOCX:', error);
      alert('Failed to export DOCX. Please try again.');
    } finally {
      setExportingDOCX(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleExportPDF}
        disabled={exportingPDF}
        variant="outline"
        className="border-2 border-orange-400 text-orange-600 hover:bg-orange-50"
      >
        {exportingPDF ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </>
        )}
      </Button>

      <Button
        onClick={handleExportDOCX}
        disabled={exportingDOCX}
        variant="outline"
        className="border-2 border-blue-400 text-blue-600 hover:bg-blue-50"
      >
        {exportingDOCX ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Export DOCX
          </>
        )}
      </Button>
    </div>
  );
};
