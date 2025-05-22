
import { Node, mergeAttributes, InputRule } from '@tiptap/core';

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
        class: 'field-name-node bg-accent hover:bg-primary/80 p-1 rounded-sm border border-input mx-0.5 text-accent-foreground cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
      },
    };
  },

  addAttributes() {
    return {
      fieldName: {
        default: 'Field',
        parseHTML: element => element.getAttribute('data-field-name'),
        renderHTML: attributes => ({ 
          'data-field-name': attributes.fieldName,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="field-name"]',
        // When parsing, Tiptap uses the innerText of the span as the node's content by default.
        // We want the fieldName attribute to be the source of truth for the display text.
        // So, renderHTML will use node.attrs.fieldName.
        // If content is 'text*', it might try to populate it.
        // For atom nodes, it's often better to manage display solely via renderHTML from attributes.
        // Let's ensure it takes fieldName from attribute for display consistency.
        getAttrs: (dom: HTMLElement) => {
          const fieldName = dom.getAttribute('data-field-name');
          if (fieldName) {
            return { fieldName };
          }
          return false; // Don't parse if attribute is missing
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    // The visual text of the node is determined by the fieldName attribute.
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), node.attrs.fieldName];
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
