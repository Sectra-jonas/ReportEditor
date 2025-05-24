
"use client";

import { useEditor, EditorContent, type EditorEvents } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import { Gapcursor } from '@tiptap/extension-gapcursor';
import type { Editor } from '@tiptap/react';
import { useEffect, useState, useCallback } from 'react';
import EditorToolbar from './EditorToolbar';
import { FieldNameNode } from './extensions/FieldNameNode';
import { MultiOptionNode } from './extensions/MultiOptionNode';
import { DragDropFieldExtension } from './extensions/DragDropFieldExtension';
import { TemplateEditorSidebar } from './TemplateEditorSidebar';


interface TemplateEditorProps {
  content?: string | Record<string, any>;
  onUpdate?: (props: EditorEvents['update']) => void;
  setEditorInstance?: (editor: Editor | null) => void;
}

interface SelectedField {
  type: 'field' | 'multi-option';
  nodeId: string;
  defaultText?: string;
  options?: Array<{ id: string; text: string }>;
}

const TemplateEditor = ({
  content,
  onUpdate,
  setEditorInstance,
}: TemplateEditorProps) => {
  const [selectedField, setSelectedField] = useState<SelectedField | null>(null);
  
  const handleFieldSelect = useCallback((nodeId: string, type: 'field' | 'multi-option', editorInstance: Editor) => {
    let fieldData: SelectedField | null = null;
    
    editorInstance.state.doc.descendants((node, pos) => {
      if (node.attrs.nodeId === nodeId) {
        if (type === 'field' && node.type.name === 'fieldName') {
          fieldData = {
            type: 'field',
            nodeId,
            defaultText: node.attrs.defaultText || node.attrs.fieldName || '',
          };
        } else if (type === 'multi-option' && node.type.name === 'multiOption') {
          const options = (node.attrs.options as string || '').split('|').map((opt, index) => ({
            id: `option-${index}`,
            text: opt.trim()
          }));
          fieldData = {
            type: 'multi-option',
            nodeId,
            options,
          };
        }
        return false;
      }
    });
    
    setSelectedField(fieldData);
  }, []);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, 
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Design your template. Drag fields from the sidebar or use [FieldName] for basic fields and [OptionA|OptionB|OptionC] for multi-choice fields.",
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      FieldNameNode,
      MultiOptionNode,
      DragDropFieldExtension,
      Gapcursor,
    ],
    content: content,
    editable: true,
    onUpdate: (props) => {
      onUpdate?.(props);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert focus:outline-none w-full h-full p-4 bg-card text-card-foreground',
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

  const handleFieldUpdate = useCallback((field: SelectedField) => {
    if (!editor) return;
    
    if (field.type === 'field') {
      // @ts-ignore - Command exists but not in types
      editor.chain().updateFieldNode(field.nodeId, {
        defaultText: field.defaultText || '',
      }).run();
    } else if (field.type === 'multi-option' && field.options) {
      // @ts-ignore - Command exists but not in types
      editor.chain().updateMultiOptionNode(field.nodeId, {
        options: field.options.map(opt => opt.text),
      }).run();
    }
    
    setSelectedField(field);
  }, [editor]);

  // Add click handler to detect field selection
  useEffect(() => {
    if (!editor) return;

    const clickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const fieldNode = target.closest('[data-node-id]');
      
      if (fieldNode) {
        const nodeId = fieldNode.getAttribute('data-node-id');
        const nodeType = fieldNode.getAttribute('data-node-type') as 'field' | 'multi-option';
        
        if (nodeId && nodeType) {
          handleFieldSelect(nodeId, nodeType, editor);
        }
      }
    };

    editor.view.dom.addEventListener('click', clickHandler);
    
    return () => {
      editor.view.dom.removeEventListener('click', clickHandler);
    };
  }, [editor, handleFieldSelect]);

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 border border-slate-600 rounded-md shadow-sm bg-slate-800">
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} className="flex-grow overflow-y-auto" />
      </div>
      <TemplateEditorSidebar
        selectedField={selectedField}
        onFieldUpdate={handleFieldUpdate}
      />
    </div>
  );
};

export default TemplateEditor;
