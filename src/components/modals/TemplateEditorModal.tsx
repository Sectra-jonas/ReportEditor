
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
import TemplateEditor from "@/components/editor/TemplateEditor";
import { useTemplates } from "@/contexts/TemplateContext";
import { useEffect, useState } from "react";
import { SaveFileDialog } from "./SaveFileDialog";
import { FileUp, FileDown, FilePlus2 } from "lucide-react";

interface TemplateEditorModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TemplateEditorModal = ({
  isOpen,
  onOpenChange,
}: TemplateEditorModalProps) => {
  const { 
    templateEditor, 
    setTemplateEditor, 
    currentTemplate, 
    isTemplateDirty, 
    setIsTemplateDirty,
    createNewTemplate,
    saveTemplateToFile,
    loadTemplateFromFile,
  } = useTemplates();

  const [isSaveTemplateDialogOpen, setIsSaveTemplateDialogOpen] = useState(false);

  useEffect(() => {
    // if modal opens and no template, create a new one
    if (isOpen && !currentTemplate) {
      createNewTemplate();
    }
  }, [isOpen, currentTemplate, createNewTemplate]); 

  const handleSave = () => {
    setIsSaveTemplateDialogOpen(true);
  };

  const confirmSave = (name: string) => {
    saveTemplateToFile(name);
  };

  const handleEditorUpdate = () => {
    if (!isTemplateDirty) setIsTemplateDirty(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Report Template Editor</DialogTitle>
            <DialogDescription>
              Create, edit, load, and save report templates.
              Drag fields from the sidebar to add them to your template. Click on any field to edit its properties in the sidebar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 px-6 py-2 border-b">
            <Button variant="outline" size="sm" onClick={createNewTemplate}>
              <FilePlus2 className="mr-2 h-4 w-4" /> New Template
            </Button>
            <Button variant="outline" size="sm" onClick={loadTemplateFromFile}>
              <FileUp className="mr-2 h-4 w-4" /> Load Template
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={!templateEditor || (!isTemplateDirty && currentTemplate?.name !== 'Untitled Template' && !currentTemplate?.name.startsWith("Untitled"))}>
              <FileDown className="mr-2 h-4 w-4" /> Save Template
            </Button>
          </div>

          <div className="flex-grow overflow-hidden">
            <div className="h-full px-6 py-2">
              <TemplateEditor
                content={currentTemplate?.content}
                setEditorInstance={setTemplateEditor}
                onUpdate={handleEditorUpdate}
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SaveFileDialog
        isOpen={isSaveTemplateDialogOpen}
        onOpenChange={setIsSaveTemplateDialogOpen}
        onSave={confirmSave}
        defaultName={currentTemplate?.name || "Untitled Template"}
        title="Save Report Template"
        description="Enter a name for your template."
      />
    </>
  );
};

