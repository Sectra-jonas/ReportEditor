
"use client";

import { useEditor, EditorContent, type EditorEvents, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import type { Editor } from '@tiptap/react';
import { useEffect } from 'react';

// Custom Extensions
import { FieldNameNode } from './extensions/FieldNameNode';
import { MultiOptionNode } from './extensions/MultiOptionNode';
// import { MultiOptionNodeView } from './nodeviews/MultiOptionNodeView'; // Important for ReactNodeViewRenderer - MultiOptionNode handles its own NodeView
import { TabFocusNavigationExtension } from './extensions/TabFocusNavigationExtension';


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
      MultiOptionNode.configure({
        // NodeView is configured directly in MultiOptionNode.ts via addNodeView
      }),
      TabFocusNavigationExtension,
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

    // This effect ensures the editor's content reflects the 'content' prop.
    // The 'editable' prop passed to useEditor() handles interactivity.
    // This focuses on visual synchronization.

    const currentEditorHTML = editor.getHTML();
    const currentEditorJSON = editor.getJSON(); // For comparison if content is JSON

    let newContentIsDifferent = false;

    if (typeof content === 'string') {
      if (currentEditorHTML !== content) {
        newContentIsDifferent = true;
      }
    } else if (content && typeof content === 'object') { // TipTap JSON object
      if (JSON.stringify(currentEditorJSON) !== JSON.stringify(content)) {
        newContentIsDifferent = true;
      }
    } else if (!content) { // content is null, undefined, or empty string
      if (currentEditorHTML !== '' && currentEditorHTML !== '<p></p>') { // Avoid redundant clear
        newContentIsDifferent = true; // Treat as different if editor is not "empty"
      }
    }

    if (newContentIsDifferent) {
      if (content) {
        editor.commands.setContent(content, false); // emitUpdate: false
      } else {
        editor.commands.clearContent(false); // emitUpdate: false
      }
    }
  // The 'editable' prop directly controls useEditor's behavior.
  // This effect syncs content based on the 'content' prop itself.
  // If 'editable' changes, useEditor reconfigures; this effect ensures content consistency.
  }, [content, editor, editable]); // 'editable' is included as changes to it might imply content should be re-evaluated/set,
                                   // even if useEditor itself handles the interactive state.


  return <EditorContent editor={editor} className="h-full flex-grow" />;
};

export default RichTextEditor;
