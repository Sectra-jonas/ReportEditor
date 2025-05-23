
import { Node, mergeAttributes, InputRule } from '@tiptap/core';

export interface FieldNameOptions {
  HTMLAttributes: Record<string, any>;
}

// Regex to match [FieldName] at the end of input for InputRule
const fieldNameInputRuleRegex = /\[([^[\]]+)\]$/;

export const FieldNameNode = Node.create<FieldNameOptions>({
  name: 'fieldName',
  group: 'inline', 
  content: 'text*', // Allows text content to be editable
  inline: true,
  selectable: true,
  atom: false, // Allow content to be editable

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
        // Parse the field name from the attribute for consistency
        getAttrs: (dom: HTMLElement) => {
          const fieldName = dom.getAttribute('data-field-name') || dom.textContent?.trim();
          if (fieldName) {
            return { fieldName };
          }
          return false; // Don't parse if no field name found
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    // Allow the content to be rendered and edited directly
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-type': 'field-name'
    }), 0]; // 0 means render the content
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
            
            const newNode = this.type.create({ fieldName: fieldNameText }, state.schema.text(fieldNameText));
            tr.insert(start, newNode);
            // Set selection to be after the inserted node
            // tr.setSelection(TextSelection.create(tr.doc, start + newNode.nodeSize));
          }
        },
      }),
    ];
  },
});
