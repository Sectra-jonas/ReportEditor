
"use client";

import type { Editor } from '@tiptapreact';
import {
  Bold, Italic, Underline, Heading1, Heading2, Heading3, Undo, Redo, Mic, MicOff, Pilcrow, List, ListOrdered, TableIcon as InsertTableIcon, Trash2 as DeleteTableIcon, PlusSquare as AddRowIcon, MinusSquare as DeleteRowIcon, Plus as AddColIcon, Minus as DeleteColIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Separator } from '../ui/separator';
import { useState } from 'react';
import { CreateTableDialog } from '../modals/CreateTableDialog'; // New Dialog

interface EditorToolbarProps {
  editor: Editor | null;
  isVoiceActive?: boolean;
  onToggleVoice?: () => void;
  disableControls?: boolean;
}

const EditorToolbar = ({ editor, isVoiceActive, onToggleVoice, disableControls = false }: EditorToolbarProps) => {
  const [isCreateTableDialogOpen, setIsCreateTableDialogOpen] = useState(false);

  if (!editor) {
    return ( 
      <div className="flex items-center space-x-1 p-2 border-b border-border bg-card rounded-t-md flex-wrap gap-1 opacity-50 cursor-not-allowed">
        <Toggle size="sm" disabled aria-label="Toggle bold"><Bold className="h-4 w-4" /></Toggle>
        <Toggle size="sm" disabled aria-label="Toggle italic"><Italic className="h-4 w-4" /></Toggle>
        {/* ... other disabled controls ... */}
        <Button variant="ghost" size="sm" disabled><InsertTableIcon className="h-4 w-4" /></Button>
      </div>
    );
  }

  const isDisabled = disableControls || !editor.isEditable;
  const isTableFocused = editor.isActive('table');

  const handleCreateTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  };

  return (
    <>
      <div className="flex items-center space-x-1 p-2 border-b border-border bg-card rounded-t-lg flex-wrap gap-1">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Toggle bold"
          disabled={isDisabled}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Toggle italic"
          disabled={isDisabled}
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('underline')}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Toggle underline"
          disabled={isDisabled}
        >
          <Underline className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isDisabled}>
              <Heading1 className="h-4 w-4 mr-1" /> Headings <span className="sr-only">Toggle Heading</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
              className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
              disabled={isDisabled}
            >
              <Heading1 className="h-4 w-4 mr-2" /> Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
              className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
              disabled={isDisabled}
            >
              <Heading2 className="h-4 w-4 mr-2" /> Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
              className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
              disabled={isDisabled}
            >
              <Heading3 className="h-4 w-4 mr-2" /> Heading 3
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().setParagraph().run()} 
              className={editor.isActive('paragraph') ? 'bg-accent' : ''} 
              disabled={isDisabled}
              >
              <Pilcrow className="h-4 w-4 mr-2" /> Paragraph
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={isDisabled || !editor.can().undo()}>
          <Undo className="h-4 w-4" /> <span className="sr-only">Undo</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={isDisabled || !editor.can().redo()}>
          <Redo className="h-4 w-4" /> <span className="sr-only">Redo</span>
        </Button>

        {onToggleVoice && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant={isVoiceActive ? "destructive" : "ghost"} size="sm" onClick={onToggleVoice} aria-label="Toggle voice input" disabled={isDisabled}>
              {isVoiceActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            {isVoiceActive && <span className="text-xs text-muted-foreground animate-pulse">Listening...</span>}
          </>
        )}

        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Button variant="ghost" size="sm" onClick={() => setIsCreateTableDialogOpen(true)} disabled={isDisabled || isTableFocused} aria-label="Insert table">
          <InsertTableIcon className="h-4 w-4" />
        </Button>

        {isTableFocused && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDisabled}>
                  Table Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()} disabled={isDisabled || !editor.can().addRowAfter()}>
                  <AddRowIcon className="mr-2 h-4 w-4" /> Add Row After
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()} disabled={isDisabled || !editor.can().addRowBefore()}>
                  <AddRowIcon className="mr-2 h-4 w-4 rotate-180" /> Add Row Before
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()} disabled={isDisabled || !editor.can().deleteRow()}>
                  <DeleteRowIcon className="mr-2 h-4 w-4" /> Delete Row
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={isDisabled || !editor.can().addColumnAfter()}>
                   <AddColIcon className="mr-2 h-4 w-4" /> Add Column After
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()} disabled={isDisabled || !editor.can().addColumnBefore()}>
                   <AddColIcon className="mr-2 h-4 w-4 rotate-180" /> Add Column Before
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()} disabled={isDisabled || !editor.can().deleteColumn()}>
                  <DeleteColIcon className="mr-2 h-4 w-4" /> Delete Column
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderRow().run()} disabled={isDisabled || !editor.can().toggleHeaderRow()}>
                  Toggle Header Row
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderColumn().run()} disabled={isDisabled || !editor.can().toggleHeaderColumn()}>
                  Toggle Header Column
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeaderCell().run()} disabled={isDisabled || !editor.can().toggleHeaderCell()}>
                  Toggle Header Cell
                </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={() => editor.chain().focus().mergeOrSplit().run()} disabled={isDisabled || !editor.can().mergeOrSplit()}>
                  Merge/Split Cells
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10" onClick={() => editor.chain().focus().deleteTable().run()} disabled={isDisabled || !editor.can().deleteTable()}>
                  <DeleteTableIcon className="mr-2 h-4 w-4" /> Delete Table
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
      <CreateTableDialog
        isOpen={isCreateTableDialogOpen}
        onOpenChange={setIsCreateTableDialogOpen}
        onCreate={handleCreateTable}
      />
    </>
  );
};

export default EditorToolbar;
