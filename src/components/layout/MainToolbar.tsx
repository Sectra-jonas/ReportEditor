"use client";

import { Button } from "@/components/ui/button";
import {
  FilePlus2, Save, Trash2, FileDown as ExportPdfIcon, 
  ClipboardEdit, ListChecks
} from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { useReport } from "@/contexts/ReportContext";
import { useState } from "react";
import { NewReportDialog } from "../modals/NewReportDialog";
import { ConfirmationDialog } from "../modals/ConfirmationDialog";
import { SaveFileDialog } from "../modals/SaveFileDialog";
import { TemplateEditorModal } from "../modals/TemplateEditorModal";
import { useToast } from "@/hooks/use-toast";
import { ReportTemplate } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const MainToolbar = () => {
  const { 
    createNewReport, 
    saveCurrentReport, 
    discardCurrentReport, 
    exportReportToPdf,
    currentReport,
    isDirty,
    reports,
    loadReport
  } = useReport();
  const { toast } = useToast();

  const [isNewReportDialogOpen, setIsNewReportDialogOpen] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [isSaveReportDialogOpen, setIsSaveReportDialogOpen] = useState(false);
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);

  const handleSaveReport = () => {
    if (currentReport && (currentReport.name === 'Untitled Report' || !currentReport.name)) {
      setIsSaveReportDialogOpen(true);
    } else {
      saveCurrentReport();
    }
  };

  const confirmSaveReport = (name: string) => {
    saveCurrentReport(name);
  };

  const handleSelectNewReport = (template?: ReportTemplate) => {
    if(isDirty || (currentReport && currentReport.content && currentReport.content !== '<p></p>')) {
      // TODO: show confirmation if current report is dirty
      // For now, just proceed
    }
    createNewReport(template);
  }

  return (
    <>
      <div className="flex items-center space-x-2 p-3 border-b border-border bg-background shadow-sm flex-wrap gap-2">
        <Button onClick={() => setIsNewReportDialogOpen(true)}>
          <FilePlus2 className="mr-2 h-4 w-4" /> New Report
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={reports.length === 0}>
              <ListChecks className="mr-2 h-4 w-4" /> Load Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Saved Reports</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {reports.length > 0 ? reports.map(report => (
              <DropdownMenuItem key={report.id} onClick={() => loadReport(report.id)}>
                {report.name} - <span className="text-xs text-muted-foreground ml-2">{new Date(report.updatedAt).toLocaleDateString()}</span>
              </DropdownMenuItem>
            )) : (
              <DropdownMenuItem disabled>No saved reports</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button onClick={handleSaveReport} disabled={!currentReport || (!isDirty && currentReport.name !== 'Untitled Report')}>
          <Save className="mr-2 h-4 w-4" /> Save Report
        </Button>
        <Button variant="outline" onClick={() => setIsDiscardConfirmOpen(true)} disabled={!currentReport}>
          <Trash2 className="mr-2 h-4 w-4" /> Discard Report
        </Button>

        <Separator orientation="vertical" className="h-8 mx-2" />

        <Button variant="outline" onClick={() => setIsTemplateEditorOpen(true)}>
          <ClipboardEdit className="mr-2 h-4 w-4" /> Template Editor
        </Button>

        <Separator orientation="vertical" className="h-8 mx-2" />

        <Button variant="outline" onClick={exportReportToPdf} disabled={!currentReport}>
          <ExportPdfIcon className="mr-2 h-4 w-4" /> Export to PDF
        </Button>
      </div>

      <NewReportDialog
        isOpen={isNewReportDialogOpen}
        onOpenChange={setIsNewReportDialogOpen}
        onSelect={handleSelectNewReport}
      />
      <ConfirmationDialog
        isOpen={isDiscardConfirmOpen}
        onOpenChange={setIsDiscardConfirmOpen}
        title="Discard Report?"
        description="Are you sure you want to discard the current report? All unsaved changes will be lost."
        onConfirm={discardCurrentReport}
        confirmText="Discard"
      />
      <SaveFileDialog
        isOpen={isSaveReportDialogOpen}
        onOpenChange={setIsSaveReportDialogOpen}
        onSave={confirmSaveReport}
        defaultName={currentReport?.name || "Untitled Report"}
        title="Save Report"
        description="Enter a name for your report."
      />
      <TemplateEditorModal
        isOpen={isTemplateEditorOpen}
        onOpenChange={setIsTemplateEditorOpen}
      />
    </>
  );
};
