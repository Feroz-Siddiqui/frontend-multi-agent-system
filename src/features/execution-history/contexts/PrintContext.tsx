/**
 * Print Context
 * 
 * Provides print mode state and PDF generation functionality
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { setupPrintListeners } from '../utils/pdf-generator';

interface PrintContextType {
  isPrintMode: boolean;
  isExporting: boolean;
  enterPrintMode: () => void;
  exitPrintMode: () => void;
  setExporting: (exporting: boolean) => void;
}

const PrintContext = createContext<PrintContextType | undefined>(undefined);

interface PrintProviderProps {
  children: ReactNode;
}

export function PrintProvider({ children }: PrintProviderProps) {
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const enterPrintMode = () => {
    setIsPrintMode(true);
    document.body.classList.add('print-mode');
  };

  const exitPrintMode = () => {
    setIsPrintMode(false);
    document.body.classList.remove('print-mode');
  };

  const setExporting = (exporting: boolean) => {
    setIsExporting(exporting);
  };

  // Setup print event listeners
  useEffect(() => {
    const cleanup = setupPrintListeners(
      () => {
        // Before print: enter print mode
        enterPrintMode();
      },
      () => {
        // After print: exit print mode and reset exporting state
        exitPrintMode();
        setExporting(false);
      }
    );

    return cleanup;
  }, []);

  return (
    <PrintContext.Provider value={{ 
      isPrintMode, 
      isExporting, 
      enterPrintMode, 
      exitPrintMode, 
      setExporting 
    }}>
      {children}
    </PrintContext.Provider>
  );
}

export function usePrintMode() {
  const context = useContext(PrintContext);
  if (context === undefined) {
    throw new Error('usePrintMode must be used within a PrintProvider');
  }
  return context;
}
