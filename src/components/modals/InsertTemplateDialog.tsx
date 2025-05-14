
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

interface InsertTemplateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: ReportTemplate) => void;
}

export const InsertTemplateDialog = ({
  isOpen,
  onOpenChange,
  onSelect,
}: InsertTemplateDialogProps) => {
  const { loadedTemplates } = useTemplates();

  const handleSelect = (template: ReportTemplate) => {
    onSelect(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Insert Template into Report</DialogTitle>
          <DialogDescription>
            Select a template to insert its content at the current cursor position.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {loadedTemplates.length > 0 ? (
            <ScrollArea className="h-[250px] w-full rounded-md border p-2">
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
          ) : (
             <p className="text-sm text-muted-foreground text-center py-4">
                No templates loaded. You can create or load templates via the Template Editor.
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
