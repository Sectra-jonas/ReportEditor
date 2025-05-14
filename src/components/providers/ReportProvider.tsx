"use client";

import { ReportContext, type ReportContextType } from '@/contexts/ReportContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import { REPORT_LOCAL_STORAGE_KEY, TEMPLATE_FILE_EXTENSION, REPORT_FILE_EXTENSION } from '@/lib/constants';
import type { Report, ReportTemplate } from '@/types';
import type { Editor } from '@tiptap/react';
import { useState, type ReactNode, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid'; // Need to install uuid: npm install uuid @types/uuid

// Helper function to generate PDF (simplified)
async function generatePdf(contentHtml: string, reportName: string) {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  const element = document.createElement('div');
  element.innerHTML = contentHtml;
  element.style.width = '210mm'; // A4 width
  element.style.padding = '20mm';
  element.style.visibility = 'hidden';
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  document.body.appendChild(element);

  const canvas = await html2canvas(element, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
  let position = 0;
  let heightLeft = pdfHeight;
  const pageHeight = pdf.internal.pageSize.getHeight() - 20; // With margin

  pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight -20); // Adjust as needed
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position + 10, pdfWidth - 20, pdfHeight-20);
    heightLeft -= pageHeight;
  }
  
  pdf.save(`${reportName}.pdf`);
  document.body.removeChild(element);
}


export const ReportProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [reports, setReports] = useLocalStorage<Report[]>(REPORT_LOCAL_STORAGE_KEY, []);
  const [currentReport, setCurrentReportState] = useState<Report | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const setCurrentReport = (report: Report | null) => {
    setCurrentReportState(report);
    if (editor && report) {
      editor.commands.setContent(report.content || '');
    } else if (editor && !report) {
      editor.commands.setContent('');
    }
    setIsDirty(false);
  };
  
  useEffect(() => {
    if (editor && currentReport && editor.getHTML() !== currentReport.content) {
      // Initial content set should not mark as dirty immediately
      // This logic might need refinement to avoid marking dirty on initial load
      // For now, assume any programmatic setContent followed by user action makes it dirty.
    }
  }, [editor, currentReport]);


  const createNewReport = useCallback((template?: ReportTemplate) => {
    const newReport: Report = {
      id: uuidv4(),
      name: 'Untitled Report',
      content: template?.content || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentReport(newReport);
    if (editor) {
      editor.commands.setContent(newReport.content);
      editor.commands.focus();
    }
    setIsDirty(!!template); // Dirty if created from template, as it has content
    toast({ title: "New report created." });
  }, [editor, toast]);

  const saveCurrentReport = useCallback(async (name?: string) => {
    if (!currentReport || !editor) {
      toast({ title: "Error", description: "No active report or editor found.", variant: "destructive" });
      return;
    }
    const reportName = name || currentReport.name;
    const updatedReport: Report = {
      ...currentReport,
      name: reportName,
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
    setCurrentReport(updatedReport); // Update state with saved content
    setIsDirty(false);
    toast({ title: "Report Saved", description: `"${reportName}" has been saved.` });
  }, [currentReport, editor, setReports, toast]);

  const discardCurrentReport = useCallback(() => {
    setCurrentReport(null);
    if (editor) {
      editor.commands.clearContent();
    }
    setIsDirty(false);
    toast({ title: "Report Cleared" });
  }, [editor, toast]);

  const exportReportToPdf = useCallback(async () => {
    if (!currentReport || !editor) {
      toast({ title: "Error", description: "No active report to export.", variant: "destructive" });
      return;
    }
    try {
      const contentHtml = editor.getHTML();
      // Basic styling for PDF - TipTap usually outputs semantic HTML
      // More complex styling would require careful CSS considerations or a server-side PDF engine
      const styledHtml = `
        <style>
          body { font-family: sans-serif; font-size: 12pt; }
          h1 { font-size: 18pt; margin-bottom: 0.5em; }
          h2 { font-size: 16pt; margin-bottom: 0.4em; }
          h3 { font-size: 14pt; margin-bottom: 0.3em; }
          p { margin-bottom: 0.5em; line-height: 1.4; }
          strong { font-weight: bold; }
          em { font-style: italic; }
          u { text-decoration: underline; }
        </style>
        ${contentHtml}
      `;
      await generatePdf(styledHtml, currentReport.name || 'Report');
      toast({ title: "Report Exported", description: "PDF generation started." });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast({ title: "Export Error", description: "Failed to export report as PDF.", variant: "destructive" });
    }
  }, [currentReport, editor, toast]);

  const loadReport = useCallback((reportId: string) => {
    const reportToLoad = reports.find(r => r.id === reportId);
    if (reportToLoad) {
      setCurrentReport(reportToLoad);
    } else {
      toast({ title: "Error", description: "Report not found.", variant: "destructive" });
    }
  }, [reports, toast]);

  const deleteReport = useCallback((reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    if (currentReport?.id === reportId) {
      discardCurrentReport();
    }
    toast({ title: "Report Deleted" });
  }, [currentReport, setReports, discardCurrentReport, toast]);


  const value: ReportContextType = {
    currentReport,
    setCurrentReport,
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
