
import { Node, mergeAttributes, InputRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MultiOptionNodeView } from '../nodeviews/MultiOptionNodeView';

export interface MultiOptionOptions {
  HTMLAttributes: Record<string, any>;
}

// Regex to match [OptionA|OptionB|etc] at the end of input for InputRule
const multiOptionInputRuleRegex = /\[([^\]|]+(?:\|[^\]|]+)+)\]$/;

export const MultiOptionNode = Node.create<MultiOptionOptions>({
  name: 'multiOption',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true, // Crucial for NodeView and treating it as a single unit

  addOptions() {
    return {
      HTMLAttributes: {
        // Default class, will be mostly handled by NodeViewWrapper
        // class: 'multi-option-node', 
      },
    };
  },

  addAttributes() {
    return {
      options: {
        default: 'Option1|Option2',
        parseHTML: element => element.getAttribute('data-options'),
        renderHTML: attributes => ({ 'data-options': attributes.options }),
      },
      currentValue: {
        default: 'Option1', // Default to first option from 'options' ideally
        parseHTML: element => element.getAttribute('data-current-value'),
        renderHTML: attributes => ({ 'data-current-value': attributes.currentValue }),
      },
      fieldId: {
        default: null,
        parseHTML: element => element.getAttribute('data-field-id'),
        renderHTML: attributes => (attributes.fieldId ? { 'data-field-id': attributes.fieldId } : {}),
      },
      fieldName: { // Added fieldName attribute
        default: 'Multi-Option',
        parseHTML: element => element.getAttribute('data-field-name'),
        renderHTML: attributes => (attributes.fieldName ? { 'data-field-name': attributes.fieldName } : {}),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="multi-option"]',
        getAttrs: (dom: HTMLElement) => {
          const options = dom.getAttribute('data-options');
          const currentValue = dom.getAttribute('data-current-value');
          const fieldId = dom.getAttribute('data-field-id');
          const fieldName = dom.getAttribute('data-field-name'); // Parse fieldName
          
          if (options) { // 'options' is considered essential for this node type
            const attrs: { 
              options: string; 
              currentValue: string; 
              fieldId?: string | null;
              fieldName?: string | null; // Added fieldName to attrs type
            } = {
              options,
              currentValue: currentValue || options.split('|')[0]?.trim(),
            };
            if (fieldId) {
              attrs.fieldId = fieldId;
            }
            if (fieldName) { // Add fieldName if parsed
              attrs.fieldName = fieldName;
            }
            return attrs;
          }
          return false; // Don't parse if essential 'data-options' attribute is missing
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    // This is a fallback if NodeView is not used or fails.
    // The NodeView will primarily handle rendering.
    // HTMLAttributes already includes data-options, data-current-value, and data-field-id (if present)
    // due to their renderHTML definitions in addAttributes.
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 
        'data-type': 'multi-option', // Ensure this is present for parsing
        // The class below is for fallback styling if NodeView fails
        class: 'multi-option-node-fallback-render bg-accent text-accent-foreground p-1 rounded-sm border border-input mx-0.5',
      }),
      node.attrs.currentValue, // Display current value as fallback
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MultiOptionNodeView);
  },

  addInputRules() {
    return [
      new InputRule({
        find: multiOptionInputRuleRegex,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const optionsString = match[1]?.trim();

          if (optionsString) {
            const optionsArray = optionsString.split('|').map(opt => opt.trim());
            const currentValue = optionsArray[0]; // Default to the first option
            
            const start = range.from;
            const end = range.to;

            tr.delete(start, end);
            const newNode = this.type.create({ options: optionsString, currentValue });
            tr.insert(start, newNode);
          }
        },
      }),
    ];
  },
});
