
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

interface CreateTableDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (rows: number, cols: number) => void;
}

export const CreateTableDialog = ({
  isOpen,
  onOpenChange,
  onCreate,
}: CreateTableDialogProps) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  const handleCreate = () => {
    if (rows > 0 && cols > 0) {
      onCreate(rows, cols);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Table</DialogTitle>
          <DialogDescription>
            Specify the number of rows and columns for your new table.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rows" className="text-right">
              Rows
            </Label>
            <Input
              id="rows"
              type="number"
              value={rows}
              onChange={(e) => setRows(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="col-span-3"
              min="1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cols" className="text-right">
              Columns
            </Label>
            <Input
              id="cols"
              type="number"
              value={cols}
              onChange={(e) => setCols(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="col-span-3"
              min="1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
