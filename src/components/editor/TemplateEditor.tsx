"use client";

import { useEditor, EditorContent, type EditorEvents } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import type { Editor } from '@tiptap/react';
import { useEffect } from 'react';
import EditorToolbar from './EditorToolbar'; // Can reuse the same toolbar

interface TemplateEditorProps {
  content?: string | Record<string, any>;
  onUpdate?: (props: EditorEvents['update']) => void;
  setEditorInstance?: (editor: Editor | null) => void;
}

const TemplateEditor = ({
  content,
  onUpdate,
  setEditorInstance,
}: TemplateEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, 
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Design your template. Use [FieldName] for basic fields and [OptionA|OptionB] for multi-choice fields.",
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      // Future: Custom extensions for template fields to provide better UX in template editor itself.
    ],
    content: content,
    editable: true,
    onUpdate: (props) => {
      onUpdate?.(props);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert focus:outline-none w-full h-full p-4 bg-card text-card-foreground rounded-b-md',
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
        if (typeof content === 'string') {
            editor.commands.setContent(content, false);
        } else {
            editor.commands.setContent(content, false);
        }
    }
  }, [content, editor]);

  return (
    <div className="flex flex-col h-full border border-input rounded-md shadow-sm">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="flex-grow overflow-y-auto" />
    </div>
  );
};

export default TemplateEditor;
