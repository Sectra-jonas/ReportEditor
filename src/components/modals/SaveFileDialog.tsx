"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SaveFileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  defaultName?: string;
  title: string;
  description?: string;
}

export const SaveFileDialog = ({
  isOpen,
  onOpenChange,
  onSave,
  defaultName = "Untitled",
  title,
  description,
}: SaveFileDialogProps) => {
  const [fileName, setFileName] = useState(defaultName);

  const handleSave = () => {
    if (fileName.trim()) {
      onSave(fileName.trim());
      onOpenChange(false);
    }
  };
  
  // Update fileName if defaultName changes while dialog is open
  useState(() => {
    setFileName(defaultName);
  });


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fileName" className="text-right">
              Name
            </Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="col-span-3"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!fileName.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
