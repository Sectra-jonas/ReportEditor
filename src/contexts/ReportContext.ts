import type { Report, ReportTemplate } from '@/types';
import type { Editor } from '@tiptap/react';
import { createContext, useContext } from 'react';

export interface ReportContextType {
  currentReport: Report | null;
  setCurrentReport: (report: Report | null) => void;
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  createNewReport: (template?: ReportTemplate) => void;
  saveCurrentReport: (name?: string) => Promise<void>;
  discardCurrentReport: () => void;
  exportReportToPdf: () => void;
  reports: Report[];
  loadReport: (reportId: string) => void;
  deleteReport: (reportId: string) => void;
  insertTemplateIntoReport: (template: ReportTemplate) => Promise<void>; // New function
}

export const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const useReport = (): ReportContextType => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
};
