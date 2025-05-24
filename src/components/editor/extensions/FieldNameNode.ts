
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
        class: 'field-name-node bg-blue-100 hover:bg-blue-200 p-1 rounded-sm border border-blue-300 mx-0.5 text-blue-800 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 dark:border-blue-700',
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
      fieldId: {
        default: null,
        parseHTML: element => element.getAttribute('data-field-id'),
        renderHTML: attributes => (attributes.fieldId ? { 'data-field-id': attributes.fieldId } : {}),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="field-name"]',
        getAttrs: (dom: HTMLElement) => {
          const fieldName = dom.getAttribute('data-field-name') || dom.textContent?.trim();
          const fieldId = dom.getAttribute('data-field-id');
          const attrs: { fieldName?: string; fieldId?: string | null } = {};

          if (fieldName) {
            attrs.fieldName = fieldName;
          } else {
            // If there's no fieldName from data-attribute or textContent, it might be an invalid node.
            // However, to prevent errors, we can allow it to be parsed and potentially corrected later.
            // Returning false would mean the node isn't parsed at all.
            // Depending on desired strictness, this could return false.
            // For now, parse if at least one identifiable attribute is present or it has the data-type.
          }

          // fieldId is optional, so it can be null if not present
          attrs.fieldId = fieldId;
          
          // Only parse if we have a fieldName, or at least a fieldId if fieldName is missing.
          // Or, if the tag itself is enough to identify it as this node type.
          // Given the input rule creates content, fieldName should ideally always exist.
          if (attrs.fieldName || attrs.fieldId) {
              return attrs;
          }
          // If the element is just <span data-type="field-name"></span> with no other attributes
          // and no text content, it might still be valid if defaults are applied.
          // Let's assume it's valid if the tag matches.
          return {}; // Let default attributes apply
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    // HTMLAttributes will include data-field-name and data-field-id (if present)
    // due to their renderHTML definitions in addAttributes.
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-type': 'field-name'
    }), 0]; // 0 means render the content (which is node.attrs.fieldName)
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
