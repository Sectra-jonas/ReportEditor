
import { Node, mergeAttributes, InputRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { FieldNameNodeView } from '../nodeviews/FieldNameNodeView';

export interface FieldNameOptions {
  HTMLAttributes: Record<string, any>;
}

// Regex to match [FieldName] at the end of input for InputRule
const fieldNameInputRuleRegex = /\[([^[\]]+)\]$/;

export const FieldNameNode = Node.create<FieldNameOptions>({
  name: 'fieldName',
  group: 'inline',
  content: 'text*', // Allows text content, but we'll manage it as an atom typically
  inline: true,
  selectable: true,
  atom: true, // Treat as a single, indivisible unit

  addOptions() {
    return {
      HTMLAttributes: {
        // HTMLAttributes are now primarily for the React node view wrapper if needed,
        // or for how the node is represented if React rendering is not available.
        // The visual styling will be largely handled by the FieldNameNodeView component.
        class: 'field-name-node-placeholder', // Example class, can be adjusted or removed
      },
    };
  },

  addAttributes() {
    return {
      fieldName: {
        default: 'Field',
        parseHTML: element => element.getAttribute('data-field-name'),
        // renderHTML for attributes is still useful if you need this attribute on the wrapper element
        // but the visual rendering of the node's content (the field name itself)
        // will be handled by FieldNameNodeView.
        renderHTML: attributes => ({
          'data-field-name': attributes.fieldName,
          // We don't need to render the text content here as React will do it.
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-field-name]', // Keep parsing from existing data-field-name attributes
        getAttrs: (dom: HTMLElement) => {
          const fieldName = dom.getAttribute('data-field-name');
          if (fieldName) {
            return { fieldName };
          }
          // If you want to parse from the content of the span if data-field-name is not present:
          // return { fieldName: dom.innerText };
          return false; // Don't parse if attribute is missing
        },
      },
    ];
  },

  // renderHTML is removed, ReactNodeViewRenderer will handle rendering.

  addNodeView() {
    return ReactNodeViewRenderer(FieldNameNodeView);
  },

  // This rule converts "[Text]" into a FieldNameNode as the user types.
  addInputRules() {
    return [
      new InputRule({
        find: fieldNameInputRuleRegex,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const fieldNameText = match[1]?.trim();

          if (fieldNameText) {
            const start = range.from;
            const end = range.to;
            
            tr.delete(start, end);
            
            const newNode = this.type.create({ fieldName: fieldNameText });
            tr.insert(start, newNode);
            // Set selection to be after the inserted node
            // tr.setSelection(TextSelection.create(tr.doc, start + newNode.nodeSize));
          }
        },
      }),
    ];
  },
});
