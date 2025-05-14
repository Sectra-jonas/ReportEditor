"use client";

import type { Editor } from '@tiptapreact';
import {
  Bold, Italic, Underline, Heading1, Heading2, Heading3, Undo, Redo, Mic, MicOff, List, ListOrdered
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from '../ui/separator';

interface EditorToolbarProps {
  editor: Editor | null;
  isVoiceActive?: boolean;
  onToggleVoice?: () => void;
}

const EditorToolbar = ({ editor, isVoiceActive, onToggleVoice }: EditorToolbarProps) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center space-x-1 p-2 border-b border-border bg-card rounded-t-md flex-wrap gap-1">
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Toggle bold"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Toggle italic"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Toggle underline"
      >
        <Underline className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Heading1 className="h-4 w-4 mr-1" /> Headings <span className="sr-only">Toggle Heading</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}>
            <Heading1 className="h-4 w-4 mr-2" /> Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>
            <Heading2 className="h-4 w-4 mr-2" /> Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}>
            <Heading3 className="h-4 w-4 mr-2" /> Heading 3
          </DropdownMenuItem>
           <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()} className={!editor.isActive('heading') ? 'is-active' : ''}>
             Paragraph
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo className="h-4 w-4" /> <span className="sr-only">Undo</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo className="h-4 w-4" /> <span className="sr-only">Redo</span>
      </Button>

      {onToggleVoice && (
         <>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button variant="ghost" size="sm" onClick={onToggleVoice} aria-label="Toggle voice input">
            {isVoiceActive ? <MicOff className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4" />}
          </Button>
          {isVoiceActive && <span className="text-xs text-muted-foreground animate-pulse">Listening...</span>}
         </>
      )}
    </div>
  );
};

export default EditorToolbar;

