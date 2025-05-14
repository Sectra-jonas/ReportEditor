
"use client";

import { ReportContext, type ReportContextType } from '@/contexts/ReportContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import { REPORT_LOCAL_STORAGE_KEY } from '@/lib/constants';
import type { Report, ReportTemplate } from '@/types';
import type { Editor } from '@tiptap/react';
import { useState, type ReactNode, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid'; 

// Helper function to generate PDF (simplified)
async function generatePdf(contentHtml: string, reportName: string) {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  const element = document.createElement('div');
  // Add prose styles for PDF rendering to somewhat match editor
  element.innerHTML = `<div class="prose prose-sm dark:prose-invert">${contentHtml}</div>`;
  element.style.width = '210mm'; // A4 width
  element.style.padding = '20mm'; // Margins for PDF
  element.style.backgroundColor = 'white'; // Ensure consistent background for canvas
  element.style.color = 'black'; // Ensure consistent text color
  
  // Temporarily append to body to compute styles
  element.style.visibility = 'hidden';
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  document.body.appendChild(element);

  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: null });
  const imgData = canvas.toDataURL('image/png');
  
  document.body.removeChild(element); // Clean up element

  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfPageWidth = pdf.internal.pageSize.getWidth() - 20; // page width with 10mm margin on each side
  const pdfPageHeight = pdf.internal.pageSize.getHeight() - 20; // page height with 10mm margin

  const imgWidth = pdfPageWidth;
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
  
  let heightLeft = imgHeight;
  let position = 10; // Initial y position with 10mm margin

  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= pdfPageHeight;

  while (heightLeft > 0) {
    position = position - pdfPageHeight; // effectively (position - pageHeightWithoutMargins) for next page
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pdfPageHeight;
  }
  
  pdf.save(`${reportName || 'Report'}.pdf`);
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
      const options = optionsString.split('|').map(opt => opt.trim());
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
      // If content is not a string but exists, log warning and stringify.
      // This path assumes template.content should ideally be a string for processTemplateContent.
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
    if (editor.getHTML().trim() === "" || editor.getHTML().trim() === "<p></p>") {
      toast({ title: "Export Aborted", description: "Cannot export an empty report.", variant: "default" });
      return;
    }
    try {
      const contentHtml = editor.getHTML();
      await generatePdf(contentHtml, currentReport.name || 'Report');
      toast({ title: "Report Exported", description: "PDF generation started." });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast({ title: "Export Error", description: "Failed to export report as PDF.", variant: "destructive" });
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
    insertTemplateIntoReport, // Add new function to context value
  };

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
};
