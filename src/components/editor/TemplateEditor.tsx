
"use client";

import { useEditor, EditorContent, type EditorEvents } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import type { Editor } from '@tiptap/react';
import { Node as PMNode } from 'prosemirror-model'; // Import Prosemirror Node type
import { useEffect, useState, useCallback } from 'react'; // Add useCallback
import EditorToolbar from './EditorToolbar'; // Can reuse the same toolbar

// Custom Extensions for previewing in template editor (optional, but good for consistency)
// These would be readonly versions or simplified versions if full interactivity is not needed here.
// For now, template editor will just be a standard rich text editor.
import { FieldNameNode } from './extensions/FieldNameNode'; // Ensure this is imported
import { MultiOptionNode } from './extensions/MultiOptionNode'; // Ensure this is imported

// Import the custom node extensions
// import WysiwygFieldNode from './extensions/WysiwygFieldNode'; // REMOVE
// import WysiwygMultiOptionNode from './extensions/WysiwygMultiOptionNode'; // REMOVE


interface TemplateEditorProps {
  content?: string | Record<string, any>;
  onUpdate?: (props: EditorEvents['update']) => void;
  setEditorInstance?: (editor: Editor | null) => void;
  // Callbacks to inform parent about selection and to allow parent to trigger updates
  onNodeSelectionChange?: (nodeInfo: SelectedNodeInfo | null) => void;
  exposeFunctions?: (fns: { // New prop to expose functions
    updateNodeAttributes: (fieldId: string, newAttrs: Record<string, any>) => void 
  }) => void;
}

export interface SelectedNodeInfo {
  id: string; // fieldId
  type: string; // e.g., 'wysiwygField'
  attrs: Record<string, any>;
  pos: number; // position in the document
}

const TemplateEditor = ({
  content,
  onUpdate,
  setEditorInstance,
  onNodeSelectionChange,
  exposeFunctions, // Destructure new prop
}: TemplateEditorProps) => {

  const [selectedNodeInfo, setSelectedNodeInfoInternal] = useState<SelectedNodeInfo | null>(null);

  // Effect to notify parent when selectedNodeInfo changes
  useEffect(() => {
    if (onNodeSelectionChange) {
      onNodeSelectionChange(selectedNodeInfo);
    }
  }, [selectedNodeInfo, onNodeSelectionChange]);


  const handleUpdateNodeAttributes = useCallback((fieldId: string, newAttrs: Record<string, any>) => {
    if (!editor) return;
    let targetNodePos: { pos: number; node: PMNode } | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.attrs.fieldId === fieldId) {
        targetNodePos = { pos, node };
        return false; // stop iteration
      }
      return true;
    });
    if (targetNodePos) {
      editor.chain().focus().setNodeMarkup(targetNodePos.pos, undefined, { ...targetNodePos.node.attrs, ...newAttrs }).run();
      const updatedNode = editor.state.doc.nodeAt(targetNodePos.pos);
      if (updatedNode) {
        setSelectedNodeInfoInternal({ // Update internal state, which triggers onNodeSelectionChange
          id: fieldId,
          type: updatedNode.type.name,
          attrs: { ...updatedNode.attrs },
          pos: targetNodePos.pos,
        });
      }
    }
  }, [editor, setSelectedNodeInfoInternal]); // Added editor and setSelectedNodeInfoInternal to dependency array

  // Expose handleUpdateNodeAttributes via the exposeFunctions prop
  useEffect(() => {
    if (exposeFunctions && editor) { // Check if editor is initialized
      exposeFunctions({ updateNodeAttributes: handleUpdateNodeAttributes });
    }
    // Optional: If editor becomes null later and functions should be revoked
    // else if (exposeFunctions) {
    //   exposeFunctions({ updateNodeAttributes: () => console.warn("Editor not available") });
    // }
  }, [exposeFunctions, handleUpdateNodeAttributes, editor]); // Added editor to dependency array


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
      // Register the correct custom node extensions
      FieldNameNode,    // Ensure this is present
      MultiOptionNode,  // Ensure this is present
      // WysiwygFieldNode,         // Ensure this is REMOVED
      // WysiwygMultiOptionNode,   // Ensure this is REMOVED
      // To see the fields render in the template editor itself (non-interactive or with limited interaction):
      // Note: If added here, ensure no conflicts with the main report editor's interactive versions.
      // The input rules in these nodes will convert [text] as you type.
    ],
    content: content,
    editable: true,
    onUpdate: (props) => {
      onUpdate?.(props);
    },
    onSelectionUpdate: ({ editor: currentEditor }) => { // Renamed to currentEditor to avoid conflict
      let nodeInfo: SelectedNodeInfo | null = null;
      const { selection } = currentEditor.state;

      // The problematic instanceof check has been removed.
      // The logic below using editor.isActive is now the primary method.

      // Using editor.isActive for a more general approach
      // Prioritize new node types, then check old ones for robustness during transition
      if (currentEditor.isActive('fieldName')) {
        const attrs = currentEditor.getAttributes('fieldName');
        const fieldId = attrs.fieldId; // Assuming fieldId exists
        if (fieldId) {
          let foundPos = -1;
          let foundNode: PMNode | null = null;
          currentEditor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'fieldName' && node.attrs.fieldId === fieldId) {
              foundPos = pos;
              foundNode = node;
              return false; // Stop iteration
            }
            return true;
          });
          if (foundPos !== -1 && foundNode) {
            nodeInfo = { id: fieldId, type: 'fieldName', attrs: { ...foundNode.attrs }, pos: foundPos };
          }
        }
      } else if (currentEditor.isActive('multiOption')) {
        const attrs = currentEditor.getAttributes('multiOption');
        const fieldId = attrs.fieldId; // Assuming fieldId exists
        if (fieldId) {
          let foundPos = -1;
          let foundNode: PMNode | null = null;
          currentEditor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'multiOption' && node.attrs.fieldId === fieldId) {
              foundPos = pos;
              foundNode = node;
              return false; // Stop iteration
            }
            return true;
          });
          if (foundPos !== -1 && foundNode) {
            nodeInfo = { id: fieldId, type: 'multiOption', attrs: { ...foundNode.attrs }, pos: foundPos };
          }
        }
      } else if (currentEditor.isActive('wysiwygField')) { // Fallback for old type
        const attrs = currentEditor.getAttributes('wysiwygField');
        const fieldId = attrs.fieldId;
        if (fieldId) {
          let foundPos = -1;
          let foundNode: PMNode | null = null;
          currentEditor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'wysiwygField' && node.attrs.fieldId === fieldId) {
              foundPos = pos;
              foundNode = node;
              return false; // Stop iteration
            }
            return true;
          });
          if (foundPos !== -1 && foundNode) {
            nodeInfo = { id: fieldId, type: 'wysiwygField', attrs: { ...foundNode.attrs }, pos: foundPos };
          }
        }
      } else if (currentEditor.isActive('wysiwygMultiOptionField')) { // Fallback for old type
        const attrs = currentEditor.getAttributes('wysiwygMultiOptionField');
        const fieldId = attrs.fieldId;
        if (fieldId) {
          let foundPos = -1;
          let foundNode: PMNode | null = null;
          currentEditor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'wysiwygMultiOptionField' && node.attrs.fieldId === fieldId) {
              foundPos = pos;
              foundNode = node;
              return false; // Stop iteration
            }
            return true;
          });
          if (foundPos !== -1 && foundNode) {
            nodeInfo = { id: fieldId, type: 'wysiwygMultiOptionField', attrs: { ...foundNode.attrs }, pos: foundPos };
          }
        }
      }
      // Update the internal state, which then calls onNodeSelectionChange (if provided)
      setSelectedNodeInfoInternal(nodeInfo);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert focus:outline-none w-full h-full p-4 bg-card text-card-foreground rounded-b-md',
      },
      handleDrop: function(view, event, slice, moved) {
        if (!editor) return false;
        event.preventDefault();
        const data = event.dataTransfer?.getData('application/json');
        if (!data) return false;
        try {
          const { type: fieldType } = JSON.parse(data);

          // Primary check for current, correct field types
          if (fieldType === 'fieldName' || fieldType === 'multiOption') {
            const coordinates = { left: event.clientX, top: event.clientY };
            const dropPositionData = editor.view.posAtCoords(coordinates);
            if (!dropPositionData) return false;
            const dropPos = dropPositionData.pos;
            const generatedFieldId = `field-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            let nodeToInsert: Record<string, any> | null = null;

            if (fieldType === 'fieldName') {
              nodeToInsert = {
                type: 'fieldName',
                attrs: {
                  fieldId: generatedFieldId,
                  fieldName: 'New Field', // Default name
                },
                content: [{ type: 'text', text: 'New Field' }], // Initial content
              };
            } else if (fieldType === 'multiOption') { // This will be fieldType === 'multiOption'
              nodeToInsert = {
                type: 'multiOption',
                attrs: {
                  fieldId: generatedFieldId,
                  fieldName: 'New Multi-Option', // Default name for the group
                  options: 'Option 1|Option 2', // Default options string
                  currentValue: 'Option 1', // Default current value
                },
              };
            }
            // The fallback 'else if (fieldType === 'wysiwygField' || fieldType === 'wysiwygMultiOptionField')'
            // has been removed as per recommendation, assuming the sidebar only drags new types.

            if (nodeToInsert) {
              editor.chain().focus().insertContentAt(dropPos, nodeToInsert).run();
              return true; // Indicate that the drop was handled
            }
          }
          // If the fieldType is not 'fieldName' or 'multiOption', it will fall through and return false.
        } catch (error) {
          console.error("Error handling drop:", error);
          return false;
        }
        return false;
      },
      handleDragOver: function(view, event) {
        event.preventDefault();
        return true;
      },
    },
  });

  // This effect is to pass the editor instance to the parent
  useEffect(() => {
    if (setEditorInstance) {
      setEditorInstance(editor);
    }
    return () => {
      if (setEditorInstance) {
        setEditorInstance(null);
      }
    };
  }, [editor, setEditorInstance]); // Removed handleUpdateNodeAttributes from dependency array


  // Content update logic remains the same
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML();
      if (currentContent !== content) {
        if (typeof content === 'string') {
            editor.commands.setContent(content, false);
        } else {
            editor.commands.setContent(content, false);
        }
      }
    } else if (editor && content === undefined) {
      editor.commands.clearContent(false);
    }
  }, [content, editor]);

  // The actual function to update attributes based on external call (e.g., from sidebar via parent)
  // This is now passed in as `onUpdateNodeAttributes` prop which is expected to be `handleUpdateNodeAttributes` from parent.
  // So, this component doesn't define `handleUpdateNodeAttributes` itself, but rather calls the one passed from parent.
  // The prompt was: "Pass a callback function (e.g., updateNodeAttributes) to TemplateEditorSidebar."
  // "Inside updateNodeAttributes(fieldId, newAttrs): editor.chain()..."
  // This implies the function with editor access is defined here or in a component that has editor access.
  // The structure `onUpdateNodeAttributes: (fieldId: string, newAttrs: Record<string, any>) => void;` on TemplateEditorProps
  // suggests that TemplateEditor itself is *not* defining this function but is being told *how* to update by its parent.
  // This is a bit confusing. Let's assume the parent component will define handleUpdateNodeAttributes and pass it.
  // For this task, I will *implement* the logic as if it were inside TemplateEditor,
  // and then the parent component that uses TemplateEditor and TemplateEditorSidebar would bridge them.
  // The prompt for TemplateEditor.tsx says: "Pass a callback function (e.g., updateNodeAttributes) to TemplateEditorSidebar."
  // "Inside updateNodeAttributes(fieldId, newAttrs):" and then shows editor access.
  // This suggests TemplateEditor should define it.
  // Let's rename the incoming prop to avoid confusion: `triggerNodeUpdateViaParent`
  // And the one going to sidebar `handleAttributeUpdateFromSidebar`.
  // The current task is to implement the logic *in* TemplateEditor.

  // The following effect is to allow the parent to trigger an update IF NEEDED.
  // However, the primary way to update is via the callback passed to the sidebar.
  // The prompt asks to implement `handleUpdateNodeAttributes` in `TemplateEditor.tsx`.

  // This function will be passed to the sidebar (likely via a parent component).
  // For the purpose of this file's changes, we assume TemplateEditor defines this.
  // This will be part of the props passed to the parent component that then passes to sidebar.
  // This seems to be what the prompt wants: `TemplateEditor` has the editor, so it defines the update function.

  // Let's stick to the prompt: `TemplateEditor` will have `handleUpdateNodeAttributes`.
  // This function will then be passed to `TemplateEditorSidebar` (potentially through a parent).
  // So, `TemplateEditor` should define `handleUpdateNodeAttributes`.
  // The `onUpdateNodeAttributes` prop on `TemplateEditorProps` is if the PARENT wants to tell THIS editor to update.
  // This is getting circular.

  /*
    Revised understanding:
    1. TemplateEditor needs `selectedNodeInfo` state (internal or passed up). The prompt asks for it to be *maintained* here.
       Let's make it internal state for now, and pass it up via a callback.
       `const [selectedNodeInfo, setSelectedNodeInfo] = useState<SelectedNodeInfo | null>(null);`
       And then `onSelectionUpdate` calls `setSelectedNodeInfo`.
       This state is then passed to the Sidebar.

    2. TemplateEditor needs `handleUpdateNodeAttributes`.
       `const handleUpdateNodeAttributes = (fieldId: string, newAttrs: Record<string, any>) => { ... }`
       This function is then passed to the Sidebar.
  */

  // Re-adjusting based on the prompt "Track Selected Node: Maintain a state variable (e.g., selectedNodeInfo)" in TemplateEditor.tsx
  // and "Pass selectedNodeInfo to the TemplateEditorSidebar component as a prop."
  // and "Pass a callback function (e.g., updateNodeAttributes) to TemplateEditorSidebar."
  // This means TemplateEditor DEFINES these and they are available to be passed to a sibling (Sidebar) by a PARENT.
  // So, TemplateEditor itself doesn't take selectedNodeInfo as a prop, but *provides* it (and its setter for internal use).
  // It also *provides* the update function.

  // The props on TemplateEditorProps should be for how the PARENT interacts with THIS editor, not how this editor interacts with sidebar.
  // I'll remove selectedNodeInfo, setSelectedNodeInfo, onUpdateNodeAttributes from TemplateEditorProps for now,
  // as TemplateEditor will *define* these for its parent to use.
  // This is a common source of confusion in these tasks. Let's assume the parent component orchestrates.
  // So, TemplateEditor will manage its selected node, and expose a way to update nodes.
  // The parent will get selectedNodeInfo from TemplateEditor (e.g. via a callback prop like `onNodeSelectionChanged`)
  // and pass it to Sidebar. The parent will get `handleUpdateNodeAttributes` from TemplateEditor instance (or as a prop)
  // and pass it to Sidebar.

  // For this step, I will ensure TemplateEditor has the internal state and the update function ready.
  // The `onSelectionUpdate` logic added earlier correctly calls `setSelectedNodeInfo` (which needs to be a prop from parent).
  // The `handleUpdateNodeAttributes` also needs to be defined here, and called by parent.

  // Let's assume the props `setSelectedNodeInfo` and `onUpdateNodeAttributes` on `TemplateEditorProps` ARE for connecting to the parent
  // which then connects to the sidebar. This makes the most sense with the current structure.
  // `setSelectedNodeInfo` is called by this editor.
  // `onUpdateNodeAttributes` is called by this editor (but the prompt says it's passed TO sidebar).

  // Let's assume TemplateEditor defines handleUpdateNodeAttributes, and the parent passes it to the sidebar.
  // And TemplateEditor calls setSelectedNodeInfo (prop from parent) to inform about selection.

  return (
    <div className="flex flex-col h-full border border-input rounded-md shadow-sm">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="flex-grow overflow-y-auto" />
    </div>
  );
};

export default TemplateEditor;
