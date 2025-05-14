"use client";

import { useEditor, EditorContent, type EditorEvents } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import type { Editor } from '@tiptap/react';
import { useEffect } from 'react';

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
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      // TODO: Add custom extensions for [FieldName] and [OptionA|OptionB]
      // This would involve creating TipTap Nodes or Marks to handle custom rendering and interactions.
      // For example, a custom Node for `[OptionA|OptionB]` could render a span that, when clicked,
      // opens a dropdown. Navigating with TAB to select the whole field content requires event handling.
    ],
    content: content,
    editable: editable,
    onUpdate: (props) => {
      onUpdate?.(props);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert focus:outline-none w-full h-full p-4 rounded-md shadow-sm bg-card text-card-foreground border border-input ${className}`,
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
    if (editor && content && editor.getHTML() !== content) {
        // Check if content is string (HTML) or object (JSON)
        if (typeof content === 'string') {
            editor.commands.setContent(content, false);
        } else {
            editor.commands.setContent(content, false);
        }
    }
  }, [content, editor]);


  return <EditorContent editor={editor} className="h-full flex-grow" />;
};

export default RichTextEditor;
