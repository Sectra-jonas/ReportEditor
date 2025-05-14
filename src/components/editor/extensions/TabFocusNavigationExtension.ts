
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
  return nodes;
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
        if (fieldNodes.length === 0) return false; // No fields, default Tab

        let currentNodeIndex = -1;
        // Check if selection is currently on or inside a field node
        for (let i = 0; i < fieldNodes.length; i++) {
          const { pos, node } = fieldNodes[i];
          if (selection.from >= pos && selection.to <= pos + node.nodeSize) {
            currentNodeIndex = i;
            break;
          }
        }
        
        let nextNodeIndex: number;
        if (currentNodeIndex !== -1) {
          // If currently on a field, move to the next one
          nextNodeIndex = (currentNodeIndex + 1) % fieldNodes.length;
        } else {
          // If not on a field, find the closest field node after the current cursor position
          let foundNext = false;
          for (let i = 0; i < fieldNodes.length; i++) {
            if (fieldNodes[i].pos >= selection.from) {
              nextNodeIndex = i;
              foundNext = true;
              break;
            }
          }
          if (!foundNext) { // If cursor is after all fields, loop to the first
            nextNodeIndex = 0;
          }
        }
        
        const nextField = fieldNodes[nextNodeIndex!];
        if (nextField) {
          editor.commands.setNodeSelection(nextField.pos);
          // For MultiOptionNode, attempt to trigger its popover or give it focus programmatically
          // This part is tricky as NodeView interaction from here is indirect
          const domNode = view.nodeDOM(nextField.pos) as HTMLElement;
          if (domNode) {
            // domNode.focus(); // This might work if NodeViewWrapper or inner trigger is focusable
            // If it's a multiOption and we want to open its popover:
            if (nextField.node.type.name === 'multiOption') {
              // This is a bit of a hack, directly clicking the DOM element
              // It assumes the PopoverTrigger is the first interactive child or the node itself
              const trigger = domNode.querySelector('[role="button"]') as HTMLElement || domNode;
              trigger?.focus(); // First focus it
              // trigger?.click(); // Then simulate click if needed
            }
          }
          return true; // Tab handled
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
          if (selection.from >= pos && selection.to <= pos + node.nodeSize) {
            currentNodeIndex = i;
            break;
          }
        }

        let prevNodeIndex: number;
        if (currentNodeIndex !== -1) {
          prevNodeIndex = (currentNodeIndex - 1 + fieldNodes.length) % fieldNodes.length;
        } else {
          let foundPrev = false;
          for (let i = fieldNodes.length - 1; i >= 0; i--) {
            if (fieldNodes[i].pos < selection.from) {
              prevNodeIndex = i;
              foundPrev = true;
              break;
            }
          }
          if (!foundPrev) { // If cursor is before all fields, loop to the last
            prevNodeIndex = fieldNodes.length - 1;
          }
        }

        const prevField = fieldNodes[prevNodeIndex!];
        if (prevField) {
          editor.commands.setNodeSelection(prevField.pos);
          const domNode = view.nodeDOM(prevField.pos) as HTMLElement;
          if (domNode) {
            const trigger = domNode.querySelector('[role="button"]') as HTMLElement || domNode;
            trigger?.focus();
          }
          return true; // Shift-Tab handled
        }
        return false;
      },
    };
  },
});
