
"use client";

import { useEditor, EditorContent, type EditorEvents } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import type { Editor } from '@tiptap/react';
import { useEffect } from 'react';
import EditorToolbar from './EditorToolbar'; // Can reuse the same toolbar

// Custom Extensions for previewing in template editor (optional, but good for consistency)
// These would be readonly versions or simplified versions if full interactivity is not needed here.
// For now, template editor will just be a standard rich text editor.
// import { FieldNameNode } from './extensions/FieldNameNode';
// import { MultiOptionNode } from './extensions/MultiOptionNode';


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
        placeholder: "Design your template. Use [FieldName] for basic fields and [OptionA|OptionB|OptionC] for multi-choice fields.",
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      // To see the fields render in the template editor itself (non-interactive or with limited interaction):
      // FieldNameNode, // This would make [FieldName] typed here become a node
      // MultiOptionNode, // This would make [OptionA|OptionB] typed here become a node
      // Note: If added here, ensure no conflicts with the main report editor's interactive versions.
      // The input rules in these nodes will convert [text] as you type.
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
    // Only update content if it's different and editor is ready
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML(); // or getJSON() if dealing with JSON
      if (currentContent !== content) {
        // Prevent infinite loops by ensuring content actually changed
        if (typeof content === 'string') {
            editor.commands.setContent(content, false); // emitUpdate: false
        } else {
            editor.commands.setContent(content, false); // emitUpdate: false
        }
      }
    } else if (editor && content === undefined) {
      editor.commands.clearContent(false); // emitUpdate: false
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
