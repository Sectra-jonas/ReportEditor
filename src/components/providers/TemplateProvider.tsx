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
  const [isTemplateDirty, setIsTemplateDirty] = useState(false);
  const [loadedTemplates, setLoadedTemplates] = useState<ReportTemplate[]>([]); // In-memory list of templates loaded in session

  const setCurrentTemplate = (template: ReportTemplate | null) => {
    setCurrentTemplateState(template);
    if (templateEditor && template) {
      templateEditor.commands.setContent(template.content || '');
    } else if (templateEditor && !template) {
      templateEditor.commands.setContent('');
    }
    setIsTemplateDirty(false);
  };

  useEffect(() => {
    if (templateEditor && currentTemplate) {
      // Logic to detect if template content changed
    }
  }, [templateEditor, currentTemplate]);

  const addLoadedTemplate = (template: ReportTemplate) => {
    setLoadedTemplates(prev => {
      const existing = prev.find(t => t.id === template.id || t.name === template.name);
      if (existing) {
        // Optionally update existing or prevent duplicates
        toast({ title: "Template Updated", description: `Template "${template.name}" reloaded.` });
        return prev.map(t => t.id === template.id ? template : t);
      }
      toast({ title: "Template Loaded", description: `Template "${template.name}" added to session.` });
      return [...prev, template];
    });
  };

  const removeLoadedTemplate = (templateId: string) => {
    setLoadedTemplates(prev => prev.filter(t => t.id !== templateId));
    toast({ title: "Template Removed", description: "Template removed from session." });
  };

  const createNewTemplate = useCallback(() => {
    const newTemplate: ReportTemplate = {
      id: uuidv4(),
      name: 'Untitled Template',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentTemplate(newTemplate);
    if (templateEditor) {
      templateEditor.commands.setContent(newTemplate.content);
      templateEditor.commands.focus();
    }
    setIsTemplateDirty(false); // Fresh template is not dirty
    toast({ title: "New template created in editor." });
  }, [templateEditor, toast]);

  const saveTemplateToFile = useCallback(async (name?: string) => {
    if (!currentTemplate || !templateEditor) {
      toast({ title: "Error", description: "No active template or editor found.", variant: "destructive" });
      return;
    }
    const templateName = name || currentTemplate.name;
    const updatedTemplate: ReportTemplate = {
      ...currentTemplate,
      name: templateName,
      content: templateEditor.getHTML(), // Or JSON for TipTap
      updatedAt: new Date(),
    };
    
    // For saving to file system
    const contentToSave = JSON.stringify({
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      content: updatedTemplate.content, // Save HTML content or TipTap JSON
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

    setCurrentTemplate(updatedTemplate); // Update state with saved content
    addLoadedTemplate(updatedTemplate); // Also add/update it in the loaded templates list
    setIsTemplateDirty(false);
    toast({ title: "Template Saved", description: `"${templateName}" has been saved to file.` });
  }, [currentTemplate, templateEditor, toast, addLoadedTemplate]);

  const loadTemplateFromFile = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = TEMPLATE_FILE_EXTENSION + ",.json"; // Allow .json for flexibility

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
              setCurrentTemplate(newTemplate); // Load into the current template editor
              if(templateEditor) templateEditor.commands.setContent(newTemplate.content);
              addLoadedTemplate(newTemplate); // Add to session list
              toast({ title: "Template Loaded", description: `"${newTemplate.name}" loaded into editor.` });
              resolve();
            } catch (err) {
              console.error("Failed to parse template file:", err);
              toast({ title: "Load Error", description: "Failed to parse template file. Ensure it's a valid format.", variant: "destructive" });
              reject(err);
            }
          };
          reader.onerror = (err) => {
             toast({ title: "Load Error", description: "Error reading template file.", variant: "destructive" });
             reject(err);
          }
          reader.readAsText(file);
        } else {
          reject(new Error("No file selected"));
        }
      };
      input.click();
    });
  }, [templateEditor, toast, addLoadedTemplate]);


  const getTemplateById = useCallback((id: string): ReportTemplate | undefined => {
    return loadedTemplates.find(t => t.id === id);
  }, [loadedTemplates]);

  const value: TemplateContextType = {
    currentTemplate,
    setCurrentTemplate,
    templateEditor,
    setTemplateEditor,
    isTemplateDirty,
    setIsTemplateDirty,
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
