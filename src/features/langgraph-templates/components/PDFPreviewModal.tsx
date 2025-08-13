/**
 * PDFPreviewModal Component
 * 
 * Modal for previewing PDF reports before download
 */

import { useState, useEffect } from 'react';
import { X, Download, RefreshCw, Eye } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { executionService } from '../services/execution.service';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  executionId: string;
  onDownload: () => Promise<void>;
  isDownloading?: boolean;
}

export function PDFPreviewModal({ 
  isOpen, 
  onClose, 
  executionId, 
  onDownload,
  isDownloading = false 
}: PDFPreviewModalProps) {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load preview when modal opens
  useEffect(() => {
    if (isOpen && executionId) {
      loadPreview();
    }
  }, [isOpen, executionId]);

  const loadPreview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const html = await executionService.getExecutionPreview(executionId);
      setPreviewHtml(html);
    } catch (err) {
      setError('Failed to load preview. Please try again.');
      console.error('Preview load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await onDownload();
      onClose(); // Close modal after successful download
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              PDF Report Preview
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownload}
                disabled={isDownloading || isLoading}
                className="flex items-center gap-2"
              >
                {isDownloading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isDownloading ? 'Downloading...' : 'Download PDF'}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Loading preview...
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={loadPreview} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !error && previewHtml && (
            <div className="h-full overflow-auto border rounded-lg bg-white">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full min-h-[600px]"
                title="PDF Preview"
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </div>

        <div className="flex-shrink-0 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>This preview shows how your PDF report will look when downloaded.</span>
            <span>Execution ID: {executionId}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PDFPreviewModal;