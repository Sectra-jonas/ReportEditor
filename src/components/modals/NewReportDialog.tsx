"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTemplates } from "@/contexts/TemplateContext";
import type { ReportTemplate } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NewReportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template?: ReportTemplate) => void;
}

export const NewReportDialog = ({
  isOpen,
  onOpenChange,
  onSelect,
}: NewReportDialogProps) => {
  const { loadedTemplates } = useTemplates();

  const handleSelect = (template?: ReportTemplate) => {
    onSelect(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Report</DialogTitle>
          <DialogDescription>
            Start with a blank report or choose a template.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button variant="outline" onClick={() => handleSelect()} className="w-full">
            Start with Blank Report
          </Button>
          {loadedTemplates.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground mt-4">Or select a template:</p>
              <ScrollArea className="h-[200px] w-full rounded-md border p-2">
                {loadedTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant="ghost"
                    className="w-full justify-start mb-1"
                    onClick={() => handleSelect(template)}
                  >
                    {template.name}
                  </Button>
                ))}
              </ScrollArea>
            </>
          )}
           {loadedTemplates.length === 0 && (
             <p className="text-sm text-muted-foreground text-center py-4">
                No templates loaded. You can load templates via the Template Editor.
             </p>
           )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
