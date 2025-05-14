import type { ReportTemplate } from '@/types';
import type { Editor } from '@tiptap/react';
import { createContext, useContext } from 'react';

export interface TemplateContextType {
  currentTemplate: ReportTemplate | null;
  setCurrentTemplate: (template: ReportTemplate | null) => void;
  templateEditor: Editor | null;
  setTemplateEditor: (editor: Editor | null) => void;
  isTemplateDirty: boolean;
  setIsTemplateDirty: (dirty: boolean) => void;
  
  loadedTemplates: ReportTemplate[];
  addLoadedTemplate: (template: ReportTemplate) => void;
  removeLoadedTemplate: (templateId: string) => void;
  
  createNewTemplate: () => void;
  saveTemplateToFile: (name?: string) => Promise<void>;
  loadTemplateFromFile: () => Promise<void>; // Loads into editor
  getTemplateById: (id: string) => ReportTemplate | undefined;
}

export const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const useTemplates = (): TemplateContextType => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
};
