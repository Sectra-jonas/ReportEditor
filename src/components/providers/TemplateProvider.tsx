
"use client";

import { TemplateContext, type TemplateContextType } from '@/contexts/TemplateContext';
import type { ReportTemplate } from '@/types';
import type { Editor } from '@tiptap/react';
import { useState, type ReactNode, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid'; // Ensure uuid is installed
import { TEMPLATE_FILE_EXTENSION } from '@/lib/constants';

export const TemplateProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [currentTemplate, setCurrentTemplateState] = useState<ReportTemplate | null>(null);
  const [templateEditor, setTemplateEditor] = useState<Editor | null>(null);
  const [isTemplateDirty, setIsTemplateDirtyState] = useState(false);
  const [loadedTemplates, setLoadedTemplates] = useState<ReportTemplate[]>([]);

  const setCurrentTemplateForContext = useCallback((template: ReportTemplate | null) => {
    setCurrentTemplateState(template);
    if (templateEditor && template) {
      templateEditor.commands.setContent(template.content || '', false); // emitUpdate: false to prevent loops
    } else if (templateEditor && !template) {
      templateEditor.commands.setContent('', false); // emitUpdate: false
    }
    setIsTemplateDirtyState(false);
  }, [templateEditor]);

  const setIsTemplateDirtyForContext = useCallback((dirty: boolean) => {
    setIsTemplateDirtyState(dirty);
  }, []);

  useEffect(() => {
    if (templateEditor && currentTemplate) {
      // Logic to detect if template content changed might have existed here
      // For example, compare editor.getHTML() with currentTemplate.content
      // and set isTemplateDirty accordingly. For now, updates are manual.
    }
  }, [templateEditor, currentTemplate]);

  const addLoadedTemplate = useCallback((template: ReportTemplate) => {
    setLoadedTemplates(prev => {
      const existing = prev.find(t => t.id === template.id || t.name === template.name);
      if (existing) {
        // Optionally update existing or prevent duplicates
        setTimeout(() => toast({ title: "Template Updated", description: `Template "${template.name}" reloaded.` }), 0);
        return prev.map(t => t.id === template.id ? template : t);
      }
      setTimeout(() => toast({ title: "Template Loaded", description: `Template "${template.name}" added to session.` }), 0);
      return [...prev, template];
    });
  }, [toast]);

  const removeLoadedTemplate = useCallback((templateId: string) => {
    setLoadedTemplates(prev => prev.filter(t => t.id !== templateId));
    setTimeout(() => toast({ title: "Template Removed", description: "Template removed from session." }),0);
  }, [toast]);

  const createNewTemplate = useCallback(() => {
    const newTemplate: ReportTemplate = {
      id: uuidv4(),
      name: 'Untitled Template',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentTemplateForContext(newTemplate); // This will also set isTemplateDirty to false
    if (templateEditor) {
      templateEditor.commands.setContent(newTemplate.content, false); // emitUpdate: false
      templateEditor.commands.focus();
    }
    // setIsTemplateDirtyState(false); // Already handled by setCurrentTemplateForContext

    // Defer toast to prevent updates during render cycle
    setTimeout(() => {
      toast({ title: "New template created in editor." });
    }, 0);
  }, [templateEditor, toast, setCurrentTemplateForContext]);

  const saveTemplateToFile = useCallback(async (name?: string) => {
    if (!currentTemplate || !templateEditor) {
      setTimeout(() => toast({ title: "Error", description: "No active template or editor found.", variant: "destructive" }), 0);
      return;
    }
    const templateName = name || currentTemplate.name;
    const updatedTemplate: ReportTemplate = {
      ...currentTemplate,
      name: templateName,
      content: templateEditor.getHTML(), 
      updatedAt: new Date(),
    };
    
    const contentToSave = JSON.stringify({
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      content: updatedTemplate.content, 
      createdAt: updatedTemplate.createdAt.toISOString(),
      updatedAt: updatedTemplate.updatedAt.toISOString(),
    });
    const blob = new Blob([contentToSave], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName}${TEMPLATE_FILE_EXTENSION}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setCurrentTemplateForContext(updatedTemplate); 
    addLoadedTemplate(updatedTemplate); 
    setIsTemplateDirtyState(false); // Explicitly set dirty to false after save
    setTimeout(() => toast({ title: "Template Saved", description: `"${templateName}" has been saved to file.` }), 0);
  }, [currentTemplate, templateEditor, toast, addLoadedTemplate, setCurrentTemplateForContext]);

  const loadTemplateFromFile = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = TEMPLATE_FILE_EXTENSION + ",.json";

      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement)?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const result = e.target?.result as string;
              const parsedTemplate = JSON.parse(result) as Partial<ReportTemplate>;
              
              if (!parsedTemplate.name || !parsedTemplate.content) {
                throw new Error("Invalid template file format.");
              }

              const newTemplate: ReportTemplate = {
                id: parsedTemplate.id || uuidv4(),
                name: parsedTemplate.name,
                content: parsedTemplate.content,
                createdAt: parsedTemplate.createdAt ? new Date(parsedTemplate.createdAt) : new Date(),
                updatedAt: new Date(),
              };
              setCurrentTemplateForContext(newTemplate); 
              if(templateEditor) templateEditor.commands.setContent(newTemplate.content, false); // emitUpdate: false
              addLoadedTemplate(newTemplate); 
              setTimeout(() => toast({ title: "Template Loaded", description: `"${newTemplate.name}" loaded into editor.` }),0);
              resolve();
            } catch (err) {
              console.error("Failed to parse template file:", err);
              setTimeout(() => toast({ title: "Load Error", description: "Failed to parse template file. Ensure it's a valid format.", variant: "destructive" }),0);
              reject(err);
            }
          };
          reader.onerror = (err) => {
             setTimeout(() => toast({ title: "Load Error", description: "Error reading template file.", variant: "destructive" }),0);
             reject(err);
          }
          reader.readAsText(file);
        } else {
          reject(new Error("No file selected"));
        }
      };
      input.click();
    });
  }, [templateEditor, toast, addLoadedTemplate, setCurrentTemplateForContext]);


  const getTemplateById = useCallback((id: string): ReportTemplate | undefined => {
    return loadedTemplates.find(t => t.id === id);
  }, [loadedTemplates]);

  const value: TemplateContextType = {
    currentTemplate,
    setCurrentTemplate: setCurrentTemplateForContext,
    templateEditor,
    setTemplateEditor, // Direct state setter from useState is stable
    isTemplateDirty,
    setIsTemplateDirty: setIsTemplateDirtyForContext,
    loadedTemplates,
    addLoadedTemplate,
    removeLoadedTemplate,
    createNewTemplate,
    saveTemplateToFile,
    loadTemplateFromFile,
    getTemplateById,
  };

  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
};

