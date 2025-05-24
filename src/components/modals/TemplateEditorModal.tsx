
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
import TemplateEditor, { SelectedNodeInfo } from "@/components/editor/TemplateEditor"; // Import SelectedNodeInfo
import { useTemplates } from "@/contexts/TemplateContext";
import { useEffect, useState } from "react";
import { SaveFileDialog } from "./SaveFileDialog";
import { FileUp, FileDown, FilePlus2 } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar"; // Added
import TemplateEditorSidebar from "@/components/editor/TemplateEditorSidebar"; // Added
import { Node as PMNode } from 'prosemirror-model'; // Added for handleUpdateNodeAttributesInModal


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
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<SelectedNodeInfo | null>(null);
  const [editorApi, setEditorApi] = useState<{ 
    updateNodeAttributes?: (fieldId: string, newAttrs: Record<string, any>) => void 
  } | null>(null);

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

  // Removed handleUpdateNodeAttributesInModal

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[85vw] xl:max-w-[75vw] h-[85vh] flex flex-col p-0"> {/* Adjusted width and height */}
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Report Template Editor</DialogTitle>
            <DialogDescription className="text-gray-700 dark:text-gray-300"> {/* Applied clearer text color */}
              Design your template by dragging fields from the sidebar. Select fields in the editor to modify their properties.
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
          
          <SidebarProvider> {/* Added SidebarProvider */}
            <div className="flex flex-1 overflow-hidden p-6 pt-2"> {/* Main content area with flex layout */}
              <div className="flex-grow h-full overflow-y-auto pr-2"> {/* Editor container */}
                <TemplateEditor
                  content={currentTemplate?.content}
                  setEditorInstance={setTemplateEditor}
                  onUpdate={handleEditorUpdate}
                  onNodeSelectionChange={setSelectedNodeInfo}
                  exposeFunctions={setEditorApi} // Pass the state setter for editor API
                />
              </div>
              <TemplateEditorSidebar
                selectedNode={selectedNodeInfo}
                onUpdateNodeAttributes={(fieldId, newAttrs) => {
                  if (editorApi?.updateNodeAttributes) {
                    editorApi.updateNodeAttributes(fieldId, newAttrs);
                  } else {
                    console.warn('editorApi.updateNodeAttributes is not yet available');
                  }
                }}
              />
            </div>
          </SidebarProvider>

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

