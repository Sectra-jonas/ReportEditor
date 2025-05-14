
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
import { MultiOptionNodeView } from './nodeviews/MultiOptionNodeView'; // Important for ReactNodeViewRenderer
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
        // Disable default Tab behavior if it conflicts with custom navigation
        history: {
          // depth: 100, // example
        },
        // Consider disabling default keyboard shortcuts for Tab if they interfere.
        // However, TabFocusNavigationExtension should take precedence if it returns true.
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      FieldNameNode, // Add custom FieldNameNode
      MultiOptionNode.configure({ // MultiOptionNode requires its NodeView
        // NodeView is configured directly in MultiOptionNode.ts via addNodeView
        // and ReactNodeViewRenderer(MultiOptionNodeView)
      }),
      TabFocusNavigationExtension, // Add Tab navigation
    ],
    content: content,
    editable: editable,
    onUpdate: (props) => {
      onUpdate?.(props);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert focus:outline-none w-full h-full p-4 rounded-b-md shadow-sm bg-card text-card-foreground border-t-0 border border-input ${className}`,
      },
      // Handle Tab key press at editorProps level if extension doesn't cover all cases or for debugging
      // handleKeyDown: (view, event) => {
      //   if (event.key === 'Tab') {
      //     // console.log("Tab pressed in editorProps");
      //     // If TabFocusNavigationExtension handles it, it should return true.
      //     // If it returns false, default browser behavior (focus next element) might occur.
      //   }
      //   return false; // Return false to allow other handlers (like extensions)
      // },
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
    if (editor && content && editable) { // Only set content if editable, to prevent resetting on readonly view
        const currentHTML = editor.getHTML();
        // Simple check, might need a more robust diff if content is complex JSON
        if (typeof content === 'string' && currentHTML !== content) {
            editor.commands.setContent(content, false);
        } else if (typeof content !== 'string') {
            // For JSON content, comparison is harder. Usually, we trust it if `content` prop changes.
            editor.commands.setContent(content, false);
        }
    } else if (editor && !content && editable) {
      editor.commands.clearContent(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor]); // Removed 'editable' from deps to allow content update even if editable changes (though less common)


  return <EditorContent editor={editor} className="h-full flex-grow" />;
};

export default RichTextEditor;

