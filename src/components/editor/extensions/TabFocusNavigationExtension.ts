
import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { NodeSelection } from 'prosemirror-state';

interface FieldNodeInfo {
  pos: number;
  node: ProseMirrorNode;
}

const findFieldNodes = (editor: Editor): FieldNodeInfo[] => {
  const nodes: FieldNodeInfo[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'fieldName' || node.type.name === 'multiOption') {
      nodes.push({ pos, node });
    }
  });
  // Sort nodes by their position in the document to ensure correct Tab order
  return nodes.sort((a, b) => a.pos - b.pos);
};

export const TabFocusNavigationExtension = Extension.create({
  name: 'tabFocusNavigation',

  addKeyboardShortcuts() {
    return {
      'Tab': () => {
        const { editor } = this;
        const { state, view } = editor;
        const { selection } = state;

        const fieldNodes = findFieldNodes(editor);
        if (fieldNodes.length === 0) return false;

        let currentNodeIndex = -1;
        if (selection instanceof NodeSelection) {
          // Find which of our fieldNodes matches the currently selected node
          for (let i = 0; i < fieldNodes.length; i++) {
            if (fieldNodes[i].pos === selection.from && fieldNodes[i].node === selection.node) {
              currentNodeIndex = i;
              break;
            }
          }
        }
        
        let nextNodeIndex: number;
        if (currentNodeIndex !== -1) {
          nextNodeIndex = (currentNodeIndex + 1);
          if (nextNodeIndex >= fieldNodes.length) {
            return false; // Allow default Tab behavior to exit editor or move to next focusable element
          }
        } else {
          // If not on a field (e.g. TextSelection), find the first field at or after the current cursor
          let foundNext = false;
          for (let i = 0; i < fieldNodes.length; i++) {
            if (fieldNodes[i].pos >= selection.from) {
              nextNodeIndex = i;
              foundNext = true;
              break;
            }
          }
          if (!foundNext) { 
            return false; // No field found after cursor, default Tab
          }
        }
        
        const nextField = fieldNodes[nextNodeIndex!];
        if (nextField) {
          editor.commands.setNodeSelection(nextField.pos);
          const domNode = view.nodeDOM(nextField.pos) as HTMLElement;
          if (domNode) {
            if (nextField.node.type.name === 'multiOption') {
              const trigger = domNode.querySelector<HTMLElement>('[role="button"]');
              trigger?.focus(); 
            } else if (nextField.node.type.name === 'fieldName') {
              view.focus(); // Ensure the editor view itself has focus for fieldName selection
            }
          }
          return true; 
        }
        return false;
      },

      'Shift-Tab': () => {
        const { editor } = this;
        const { state, view } = editor;
        const { selection } = state;

        const fieldNodes = findFieldNodes(editor);
        if (fieldNodes.length === 0) return false;

        let currentNodeIndex = -1;
        if (selection instanceof NodeSelection) {
          for (let i = 0; i < fieldNodes.length; i++) {
            if (fieldNodes[i].pos === selection.from && fieldNodes[i].node === selection.node) {
              currentNodeIndex = i;
              break;
            }
          }
        }

        let prevNodeIndex: number;
        if (currentNodeIndex !== -1) {
          prevNodeIndex = (currentNodeIndex - 1);
          if (prevNodeIndex < 0) {
            return false; // Allow default Shift-Tab behavior
          }
        } else {
          // If not on a field, find the first field strictly before current cursor
          let foundPrev = false;
          for (let i = fieldNodes.length - 1; i >= 0; i--) {
            // If selection.from is at the start of a field, we want the one before it.
            // So, check fieldNodes[i].pos < selection.from
            if (fieldNodes[i].pos < selection.from) {
              prevNodeIndex = i;
              foundPrev = true;
              break;
            }
          }
          if (!foundPrev) {
            // If no field before, maybe select the last field if cursor is after all fields
            // Or, more simply, let default behavior occur if cursor is at the start.
            // For now, stick to finding a field *before* the cursor.
            if (fieldNodes.length > 0 && selection.from > fieldNodes[fieldNodes.length -1].pos) {
                 prevNodeIndex = fieldNodes.length -1; // select last field
            } else {
                return false; 
            }
          }
        }

        const prevField = fieldNodes[prevNodeIndex!];
        if (prevField) {
          editor.commands.setNodeSelection(prevField.pos);
          const domNode = view.nodeDOM(prevField.pos) as HTMLElement;
          if (domNode) {
            if (prevField.node.type.name === 'multiOption') {
              const trigger = domNode.querySelector<HTMLElement>('[role="button"]');
              trigger?.focus();
            } else if (prevField.node.type.name === 'fieldName') {
              view.focus(); // Ensure the editor view itself has focus
            }
          }
          return true;
        }
        return false;
      },
    };
  },
});
