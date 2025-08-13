/**
 * PDF Generation Utilities
 * 
 * Simplified PDF generation using browser print API with React-friendly approach
 */

export interface PDFGenerationOptions {
  filename?: string;
  includeTimestamp?: boolean;
}

/**
 * Generate PDF using browser print dialog
 * Clean, simple approach that works reliably across browsers
 */
export const generatePDF = (options: PDFGenerationOptions = {}): void => {
  const { filename = 'execution-report', includeTimestamp = true } = options;
  
  // Set document title for PDF filename suggestion
  const originalTitle = document.title;
  const finalFilename = includeTimestamp 
    ? `${filename}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`
    : filename;
  
  document.title = finalFilename;
  
  // Trigger print dialog
  window.print();
  
  // Restore original title after a delay
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
};

/**
 * Setup print event listeners for automatic print mode handling
 * Returns cleanup function
 */
export const setupPrintListeners = (
  onBeforePrint?: () => void,
  onAfterPrint?: () => void
): (() => void) => {
  const beforePrintHandler = () => {
    onBeforePrint?.();
  };
  
  const afterPrintHandler = () => {
    onAfterPrint?.();
  };
  
  // Add event listeners
  window.addEventListener('beforeprint', beforePrintHandler);
  window.addEventListener('afterprint', afterPrintHandler);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('beforeprint', beforePrintHandler);
    window.removeEventListener('afterprint', afterPrintHandler);
  };
};

/**
 * Default PDF generation options
 */
export const DEFAULT_PDF_OPTIONS: PDFGenerationOptions = {
  filename: 'execution-report',
  includeTimestamp: true
};
