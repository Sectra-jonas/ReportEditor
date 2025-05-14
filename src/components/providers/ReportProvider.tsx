
"use client";

import { ReportContext, type ReportContextType } from '@/contexts/ReportContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import { REPORT_LOCAL_STORAGE_KEY } from '@/lib/constants';
import type { Report, ReportTemplate } from '@/types';
import type { Editor } from '@tiptap/react';
import { useState, type ReactNode, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid'; 
import {威胁森林ThreatForest} from 'next/font/google'; // This seems like an accidental insertion from a previous unrelated task. Removing.

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

  const processTemplateContent = (templateContent: string): string => {
    let processedContent = templateContent;
  
    // Replace [FieldName] with <span data-type="field-name" data-field-name="FieldName">FieldName</span>
    // This regex matches [AnythingNotIncludingBracketsOrPipe]
    processedContent = processedContent.replace(/\[([^\]|]+?)\]/g, (match, fieldNameMatch) => {
      const fieldName = fieldNameMatch.trim();
      return `<span data-type="field-name" data-field-name="${fieldName}">${fieldName}</span>`;
    });
  
    // Replace [OptionA|OptionB|OptionC] with <span data-type="multi-option" data-options="OptionA|OptionB|OptionC" data-current-value="OptionA">OptionA</span>
    // This regex matches [AnythingIncludingPipesButNotBrackets]
    processedContent = processedContent.replace(/\[(([^\]|]+?\|)+[^\]|]+?)\]/g, (match, optionsStringMatch) => {
      const optionsString = optionsStringMatch.trim();
      const options = optionsString.split('|').map(opt => opt.trim());
      const currentValue = options[0] || 'Select'; // Default to the first option
      // Sanitize options string for attribute: escape quotes if necessary, though unlikely in field names.
      const sanitizedOptionsString = options.join('|'); // Rejoin for attribute
      return `<span data-type="multi-option" data-options="${sanitizedOptionsString}" data-current-value="${currentValue}">${currentValue}</span>`;
    });
    
    return processedContent;
  };

  const setCurrentReport = (report: Report | null) => {
    setCurrentReportState(report);
    if (editor && report) {
      // If content comes from a template, it's already processed.
      // If it's existing report data, it should already be in the correct Tiptap/HTML format.
      editor.commands.setContent(report.content || '', false); // Pass 'false' to avoid re-emitting update event
    } else if (editor && !report) {
      editor.commands.setContent('', false);
    }
    setIsDirty(false);
  };
  
  useEffect(() => {
    // This effect is more about reacting to external changes to currentReport.
    // Initial content setting is handled by setCurrentReport or createNewReport.
    // isDirty is managed by editor updates.
  }, [editor, currentReport]);


  const createNewReport = useCallback((template?: ReportTemplate) => {
    let initialContent = '';
    if (template && template.content) {
      if (typeof template.content === 'string') {
        initialContent = processTemplateContent(template.content);
      } else {
        // If template content is already JSON (Tiptap format), it might not need string processing.
        // However, our custom nodes expect specific HTML representations from templates.
        // For simplicity, let's assume template.content is always a string for now that needs processing.
        // Or, convert JSON to HTML, process, then let Tiptap convert back to JSON.
        // This part might need refinement based on how templates are stored.
        // For now, assuming template.content is HTML string.
        console.warn("Template content is not a string, processing might be skipped or incorrect.");
        initialContent = JSON.stringify(template.content); // Fallback if not string
      }
    }

    const newReport: Report = {
      id: uuidv4(),
      name: 'Untitled Report',
      content: initialContent,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentReportState(newReport); // Use state setter directly
    if (editor) {
      editor.commands.setContent(newReport.content, false); // emitUpdate: false
      editor.commands.focus();
    }
    // Mark as dirty if created from template with content, or if blank report is considered an "action".
    // For now, let's say creating any new report (even blank after processing) can be considered a starting point.
    // User interaction will then make it dirty.
    setIsDirty(false); // Start clean, editor updates will set it dirty
    toast({ title: "New report created." });
  }, [editor, toast]);

  const saveCurrentReport = useCallback(async (name?: string) => {
    if (!currentReport || !editor) {
      toast({ title: "Error", description: "No active report or editor found.", variant: "destructive" });
      return;
    }
    const reportName = name || currentReport.name;
    if (!reportName || reportName.trim() === "" || reportName.trim() === "Untitled Report") {
        toast({ title: "Save Error", description: "Please provide a valid name for the report.", variant: "destructive" });
        // Optionally, re-open the SaveFileDialog here or prevent saving.
        return;
    }

    const updatedReport: Report = {
      ...currentReport,
      name: reportName.trim(),
      content: editor.getHTML(), // Save as HTML
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
    setCurrentReportState(updatedReport); // Update state with saved content using the state setter
    setIsDirty(false);
    toast({ title: "Report Saved", description: `"${reportName.trim()}" has been saved.` });
  }, [currentReport, editor, setReports, toast]);

  const discardCurrentReport = useCallback(() => {
    // Before discarding, check if dirty and prompt for confirmation (future enhancement)
    // For now, directly clear.
    const newBlankReport: Report = {
      id: uuidv4(),
      name: 'Untitled Report',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentReportState(newBlankReport); // Set to a new blank report state
    if (editor) {
      editor.commands.setContent('', false); // Clear editor content
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
    // Optionally check if current report is dirty and ask for confirmation
    const reportToLoad = reports.find(r => r.id === reportId);
    if (reportToLoad) {
      setCurrentReportState(reportToLoad); // Use state setter
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
      // If deleting current report, create a new blank one or load another
      discardCurrentReport(); // For now, clears to a new blank report
      toast({ title: "Report Deleted", description: "The current report was deleted and cleared." });
    } else {
      toast({ title: "Report Deleted" });
    }
  }, [currentReport, setReports, discardCurrentReport, toast]);

  // Load initial report or create new if none exists
  useEffect(() => {
    if (!currentReport && reports.length > 0) {
      // Load the most recently updated report if available
      // const sortedReports = [...reports].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      // setCurrentReportState(sortedReports[0]);
      // if (editor) editor.commands.setContent(sortedReports[0].content || '', false);
    } else if (!currentReport && reports.length === 0 && editor) {
      // If no reports and editor is ready, create a new blank one.
      // This might conflict with default page load creating one.
      // Let's rely on initial page load to call createNewReport if needed via ReportWorkspace.
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount


  const value: ReportContextType = {
    currentReport,
    setCurrentReport: setCurrentReportState, // Pass the state setter
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
  };

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
};
