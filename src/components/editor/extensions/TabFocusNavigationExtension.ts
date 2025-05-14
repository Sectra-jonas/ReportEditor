
import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from 'prosemirror-model';

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
        for (let i = 0; i < fieldNodes.length; i++) {
          const { pos, node } = fieldNodes[i];
          // Check if the current selection is *at the start* of the node
          // or if the node is fully selected.
          if (selection.from === pos && selection.to === pos + node.nodeSize) {
            currentNodeIndex = i;
            break;
          }
          // Fallback: if cursor is within the node, consider it current
          if (selection.from >= pos && selection.to <= pos + node.nodeSize) {
             currentNodeIndex = i;
             // break; // Don't break here, prefer exact match if available later
          }
        }
        
        let nextNodeIndex: number;
        if (currentNodeIndex !== -1) {
          nextNodeIndex = (currentNodeIndex + 1);
          if (nextNodeIndex >= fieldNodes.length) {
            // If we're at the last field, let Tab do its default behavior (e.g., move out of editor)
            // Or, if you want to loop, set nextNodeIndex = 0;
            return false; // Allow default Tab behavior to exit editor or move to next focusable element
          }
        } else {
          // If not on a field, find the first field after the current cursor
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
                // For FieldNameNode, the node itself can be focused if it has tabIndex,
                // or we can just select it. For now, setNodeSelection is enough.
                // domNode.focus(); // Requires field-name-node to have tabIndex={0}
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
        for (let i = 0; i < fieldNodes.length; i++) {
          const { pos, node } = fieldNodes[i];
          if (selection.from === pos && selection.to === pos + node.nodeSize) {
            currentNodeIndex = i;
            break;
          }
          if (selection.from >= pos && selection.to <= pos + node.nodeSize) {
             currentNodeIndex = i;
          }
        }

        let prevNodeIndex: number;
        if (currentNodeIndex !== -1) {
          prevNodeIndex = (currentNodeIndex - 1);
          if (prevNodeIndex < 0) {
            // If at the first field, allow Shift-Tab to its default behavior
            return false; 
          }
        } else {
          // If not on a field, find the first field before current cursor
          let foundPrev = false;
          for (let i = fieldNodes.length - 1; i >= 0; i--) {
            if (fieldNodes[i].pos < selection.from) {
              prevNodeIndex = i;
              foundPrev = true;
              break;
            }
          }
          if (!foundPrev) {
            return false; // No field found before cursor, default Shift-Tab
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
              // domNode.focus();
            }
          }
          return true;
        }
        return false;
      },
    };
  },
});

