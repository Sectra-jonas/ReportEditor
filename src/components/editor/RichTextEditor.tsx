
"use client";

import { useEditor, EditorContent, type EditorEvents, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import type { Editor } from '@tiptap/react';
import { useEffect } from 'react';

// Custom Extensions
import { FieldNameNode } from './extensions/FieldNameNode';
import { MultiLineFieldNode } from './extensions/MultiLineFieldNode';
import { MultiOptionNode } from './extensions/MultiOptionNode';
// import { MultiOptionNodeView } from './nodeviews/MultiOptionNodeView'; // Important for ReactNodeViewRenderer - MultiOptionNode handles its own NodeView
import { TabFocusNavigationExtension } from './extensions/TabFocusNavigationExtension';
import { AIGeneratedNode } from './extensions/AIGeneratedNode';


interface RichTextEditorProps {
  content?: string | Record<string, any>; // HTML string or TipTap JSON
  onUpdate?: (props: EditorEvents['update']) => void;
  editable?: boolean;
  placeholder?: string;
  setEditorInstance?: (editor: Editor | null) => void; // To pass editor instance to parent
  className?: string;
}

const RichTextEditor = ({
  content,
  onUpdate,
  editable = true,
  placeholder = "Start typing your report...",
  setEditorInstance,
  className
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Use custom Heading extension for specific levels
        history: {},
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      FieldNameNode,
      MultiLineFieldNode,
      MultiOptionNode.configure({
        // NodeView is configured directly in MultiOptionNode.ts via addNodeView
      }),
      TabFocusNavigationExtension,
      AIGeneratedNode,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content, // Initial content
    editable: editable, // This prop controls Tiptap's editable state
    onUpdate: (props) => {
      onUpdate?.(props);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert focus:outline-none w-full h-full p-4 rounded-b-md shadow-sm bg-card text-card-foreground border-t-0 border border-input ${className}`,
      },
    },
  });

  useEffect(() => {
    if (setEditorInstance) {
      setEditorInstance(editor);
    }
    return () => {
      if (setEditorInstance) {
        setEditorInstance(null);
      }
    };
  }, [editor, setEditorInstance]);

  useEffect(() => {
    if (!editor) return;

    const currentEditorHTML = editor.getHTML();
    const currentEditorJSON = editor.getJSON(); 

    let newContentIsDifferent = false;

    if (typeof content === 'string') {
      if (currentEditorHTML !== content) {
        newContentIsDifferent = true;
      }
    } else if (content && typeof content === 'object') { 
      if (JSON.stringify(currentEditorJSON) !== JSON.stringify(content)) {
        newContentIsDifferent = true;
      }
    } else if (!content) { 
      if (currentEditorHTML !== '' && currentEditorHTML !== '<p></p>') { 
        newContentIsDifferent = true;
      }
    }
    
    // Synchronize editor's editable state with the prop
    if (editor.isEditable !== editable) {
      editor.setEditable(editable);
    }

    if (newContentIsDifferent) {
      if (content) {
        editor.commands.setContent(content, false); 
      } else {
        editor.commands.clearContent(false); 
      }
    }
  }, [content, editor, editable]); 


  return <EditorContent editor={editor} className="h-full flex-grow" />;
};

export default RichTextEditor;
