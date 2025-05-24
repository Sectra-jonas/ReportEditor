
"use client";

import { ReportContext, type ReportContextType } from '@/contexts/ReportContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import { REPORT_LOCAL_STORAGE_KEY } from '@/lib/constants';
import { convertMarkdownToHtml } from '@/lib/utils';
import type { Report, ReportTemplate } from '@/types';
import type { Editor } from '@tiptap/react';
import { useState, type ReactNode, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid'; 

// Helper function to generate PDF
async function generatePdf(contentHtml: string, reportName: string) {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  const element = document.createElement('div');
  // Append to body FIRST to allow style computation
  document.body.appendChild(element);

  // Set styles for the container element
  element.style.width = '210mm'; // A4 width
  element.style.padding = '20mm'; // Margins for PDF
  element.style.backgroundColor = 'white'; // Ensure consistent background for canvas
  element.style.color = 'black'; // Ensure consistent text color
  
  // For off-screen rendering
  element.style.visibility = 'hidden';
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  element.style.top = '0px'; // Ensure it's in the viewport for some browsers if visibility:hidden is tricky

  // Prepare the content with prose styles, explicitly avoiding dark mode for PDF
  element.innerHTML = `<div class="prose prose-sm">${contentHtml}</div>`;
  
  // Add a small delay for the browser to render/calculate styles
  await new Promise(resolve => setTimeout(resolve, 250)); 

  try {
    const canvas = await html2canvas(element, { 
      scale: 2, 
      useCORS: true, 
      backgroundColor: '#ffffff', // Explicitly set canvas background
      logging: true, // Enable html2canvas logging for debugging
      onclone: (document) => {
        // This is a good place to ensure styles are correctly applied
        // For example, if CSS variables from :root are needed, they could be injected here.
        // For now, relying on Tailwind's compiled prose styles.
      }
    });

    // console.log('Canvas height:', canvas.height, 'Canvas width:', canvas.width);
    if (canvas.height === 0 || canvas.width === 0) {
      console.error("PDF Export Error: Canvas has zero dimensions. Content might be empty or not rendered correctly.");
      throw new Error("Canvas has zero dimensions. Content might be empty or not rendered correctly for PDF export.");
    }

    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfPageWidth = pdf.internal.pageSize.getWidth() - 20; // page width with 10mm margin on each side
    const pdfPageHeight = pdf.internal.pageSize.getHeight() - 20; // page height with 10mm margin

    let imgWidth = pdfPageWidth;
    let imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    
    // Check if image height is larger than page height, if so, scale to fit
    if (imgHeight > pdfPageHeight) {
        imgHeight = pdfPageHeight; // Cap height to page height
        imgWidth = (imgProps.width * imgHeight) / imgProps.height; // Recalculate width to maintain aspect ratio
        // If scaled width is now wider than page, cap width and recalculate height (less likely if starting with pdfPageWidth)
        if (imgWidth > pdfPageWidth) {
            imgWidth = pdfPageWidth;
            imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        }
    }


    let heightLeft = imgHeight;
    let currentPosition = 10; // Initial y position with 10mm margin

    // For single very tall images that need to be split across pages:
    const singleImageTotalHeight = (imgProps.height * pdfPageWidth) / imgProps.width;
    let singleImagePosition = 0;


    if (singleImageTotalHeight <= pdfPageHeight) {
        // Image fits on one page (or is shorter)
        pdf.addImage(imgData, 'PNG', 10, currentPosition, pdfPageWidth, singleImageTotalHeight);
    } else {
        // Image is taller than one page, needs splitting
        let remainingHeight = singleImageTotalHeight;
        while (remainingHeight > 0) {
            pdf.addImage(imgData, 'PNG', 10, currentPosition - singleImagePosition, pdfPageWidth, singleImageTotalHeight);
            remainingHeight -= pdfPageHeight;
            singleImagePosition += pdfPageHeight;
            if (remainingHeight > 0) {
                pdf.addPage();
            }
        }
    }
    
    pdf.save(`${reportName || 'Report'}.pdf`);
  } finally {
    document.body.removeChild(element); // Clean up element
  }
}


export const ReportProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [reports, setReports] = useLocalStorage<Report[]>(REPORT_LOCAL_STORAGE_KEY, []);
  const [currentReport, setCurrentReportState] = useState<Report | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const processTemplateContent = useCallback((templateContent: string): string => {
    let processedContent = templateContent;
  
    // Replace [FieldName] with <span data-type="field-name" data-field-name="FieldName">FieldName</span>
    processedContent = processedContent.replace(/\[([^\]|]+?)\]/g, (match, fieldNameMatch) => {
      const fieldName = fieldNameMatch.trim();
      return `<span data-type="field-name" data-field-name="${fieldName}">${fieldName}</span>`;
    });
  
    // Replace [OptionA|OptionB|OptionC] with <span data-type="multi-option" data-options="OptionA|OptionB|OptionC" data-current-value="OptionA">OptionA</span>
    processedContent = processedContent.replace(/\[(([^\]|]+?\|)+[^\]|]+?)\]/g, (match, optionsStringMatch) => {
      const optionsString = optionsStringMatch.trim();
      const options = optionsString.split('|').map((opt: string) => opt.trim());
      const currentValue = options[0] || 'Select'; 
      const sanitizedOptionsString = options.join('|'); 
      return `<span data-type="multi-option" data-options="${sanitizedOptionsString}" data-current-value="${currentValue}">${currentValue}</span>`;
    });
    
    return processedContent;
  }, []);

  const setCurrentReport = (report: Report | null) => {
    setCurrentReportState(report);
    if (editor && report) {
      editor.commands.setContent(report.content || '', false); 
    } else if (editor && !report) {
      editor.commands.setContent('', false);
    }
    setIsDirty(false);
  };
  
  useEffect(() => {
  }, [editor, currentReport]);


  const createNewReport = useCallback((template?: ReportTemplate) => {
    let initialContent = '';
    if (template && template.content && typeof template.content === 'string') {
      initialContent = processTemplateContent(template.content);
    } else if (template && template.content) {
      console.warn("Template content for new report is not a string, processing might be skipped or incorrect.");
      initialContent = JSON.stringify(template.content); 
    }


    const newReport: Report = {
      id: uuidv4(),
      name: 'Untitled Report',
      content: initialContent,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentReportState(newReport); 
    if (editor) {
      editor.commands.setContent(newReport.content, false); 
      editor.commands.focus();
    }
    setIsDirty(false); 
    toast({ title: "New report created." });
  }, [editor, toast, processTemplateContent]);

  const saveCurrentReport = useCallback(async (name?: string) => {
    if (!currentReport || !editor) {
      toast({ title: "Error", description: "No active report or editor found.", variant: "destructive" });
      return;
    }
    const reportName = name || currentReport.name;
    if (!reportName || reportName.trim() === "" || reportName.trim() === "Untitled Report") {
        toast({ title: "Save Error", description: "Please provide a valid name for the report.", variant: "destructive" });
        return;
    }

    const updatedReport: Report = {
      ...currentReport,
      name: reportName.trim(),
      content: editor.getHTML(), 
      updatedAt: new Date(),
    };

    setReports(prevReports => {
      const existingIndex = prevReports.findIndex(r => r.id === updatedReport.id);
      if (existingIndex > -1) {
        const newReports = [...prevReports];
        newReports[existingIndex] = updatedReport;
        return newReports;
      }
      return [...prevReports, updatedReport];
    });
    setCurrentReportState(updatedReport); 
    setIsDirty(false);
    toast({ title: "Report Saved", description: `"${reportName.trim()}" has been saved.` });
  }, [currentReport, editor, setReports, toast]);

  const discardCurrentReport = useCallback(() => {
    const newBlankReport: Report = {
      id: uuidv4(),
      name: 'Untitled Report',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentReportState(newBlankReport); 
    if (editor) {
      editor.commands.setContent('', false); 
      editor.commands.focus();
    }
    setIsDirty(false);
    toast({ title: "Report Cleared", description: "Current report content has been cleared." });
  }, [editor, toast]);

  const exportReportToPdf = useCallback(async () => {
    if (!currentReport || !editor) {
      toast({ title: "Error", description: "No active report to export.", variant: "destructive" });
      return;
    }
    const contentHtml = editor.getHTML();
    // console.log("HTML content for PDF:", contentHtml); 

    if (contentHtml.trim() === "" || contentHtml.trim() === "<p></p>") {
      toast({ title: "Export Aborted", description: "Cannot export an empty report.", variant: "default" });
      return;
    }
    try {
      await generatePdf(contentHtml, currentReport.name || 'Report');
      toast({ title: "Report Exported", description: "PDF generation started." });
    } catch (error: any) {
      console.error("PDF Export Error in useCallback:", error);
      toast({ title: "Export Error", description: `Failed to export report as PDF. ${error.message || ''}`, variant: "destructive" });
    }
  }, [currentReport, editor, toast]);

  const loadReport = useCallback((reportId: string) => {
    const reportToLoad = reports.find(r => r.id === reportId);
    if (reportToLoad) {
      setCurrentReportState(reportToLoad); 
      if (editor) {
        editor.commands.setContent(reportToLoad.content || '', false);
      }
      setIsDirty(false);
      toast({title: "Report Loaded", description: `"${reportToLoad.name}" loaded.`});
    } else {
      toast({ title: "Error", description: "Report not found.", variant: "destructive" });
    }
  }, [reports, editor, toast]);

  const deleteReport = useCallback((reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    if (currentReport?.id === reportId) {
      discardCurrentReport(); 
      toast({ title: "Report Deleted", description: "The current report was deleted and cleared." });
    } else {
      toast({ title: "Report Deleted" });
    }
  }, [currentReport, setReports, discardCurrentReport, toast]);

  const insertTemplateIntoReport = useCallback(async (template: ReportTemplate) => {
    if (!currentReport || !editor || !editor.isEditable) {
      toast({ title: "Error", description: "No active report or editor is not editable.", variant: "destructive" });
      return;
    }
    if (!template || !template.content || typeof template.content !== 'string') {
      toast({ title: "Error", description: "Selected template is invalid, empty, or not in the expected string format.", variant: "destructive" });
      return;
    }
  
    const processedContent = processTemplateContent(template.content);
  
    editor.chain().focus().insertContentAt(editor.state.selection.anchor, processedContent).run();
    setIsDirty(true);
    toast({ title: "Template Inserted", description: `Content from "${template.name}" inserted.` });
  }, [currentReport, editor, setIsDirty, toast, processTemplateContent]);

  const generateAIImpression = useCallback(async () => {
    if (!currentReport || !editor || !editor.isEditable) {
      toast({ title: "Error", description: "No active report or editor is not editable.", variant: "destructive" });
      return;
    }

    const currentContent = editor.getText();
    if (!currentContent.trim()) {
      toast({ title: "Error", description: "Please add some content to the report before generating an AI impression.", variant: "destructive" });
      return;
    }

    try {
      toast({ title: "Generating AI Impression", description: "Please wait while the AI analyzes your report..." });
      
      const response = await fetch('/api/ai-impression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportContent: currentContent }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate AI impression');
      }

      const impressionText = data.impression;
      
      if (impressionText && impressionText.trim()) {
        // Convert markdown to HTML before insertion
        const convertedHtml = convertMarkdownToHtml(impressionText);
        
        // Insert the AI-generated text with special styling at cursor position
        const aiGeneratedHtml = `<div data-ai-generated="true" class="bg-primary/20 dark:bg-primary/15 border border-primary/40 p-4 rounded-lg my-3 border-l-4 border-l-primary shadow-sm relative before:content-['🤖_AI'] before:absolute before:top-2 before:right-3 before:text-xs before:font-semibold before:text-primary before:bg-background before:px-2 before:py-1 before:rounded before:border before:border-primary/30">${convertedHtml}</div>`;
        
        editor.chain().focus().insertContentAt(editor.state.selection.anchor, aiGeneratedHtml).run();
        setIsDirty(true);
        
        toast({ title: "AI Impression Generated", description: "The AI impression has been inserted into your report." });
      } else {
        toast({ title: "Error", description: "AI generated an empty response. Please try again.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error('AI Impression Error:', error);
      toast({ 
        title: "AI Generation Failed", 
        description: error.message || "Failed to generate AI impression. Please try again.", 
        variant: "destructive" 
      });
    }
  }, [currentReport, editor, setIsDirty, toast]);


  useEffect(() => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  const value: ReportContextType = {
    currentReport,
    setCurrentReport: setCurrentReportState, 
    editor,
    setEditor,
    isDirty,
    setIsDirty,
    createNewReport,
    saveCurrentReport,
    discardCurrentReport,
    exportReportToPdf,
    reports,
    loadReport,
    deleteReport,
    insertTemplateIntoReport,
    generateAIImpression,
  };

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
};
