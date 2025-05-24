
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
      nodeId: {
        default: null,
        parseHTML: element => element.getAttribute('data-node-id'),
        renderHTML: attributes => ({ 'data-node-id': attributes.nodeId }),
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
          if (options) {
            // If currentValue isn't set, default to the first option.
            // The NodeView will also handle this logic.
            return { options, currentValue: currentValue || options.split('|')[0]?.trim() };
          }
          return false; // Don't parse if essential 'data-options' attribute is missing
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    // This is a fallback if NodeView is not used or fails.
    // The NodeView will primarily handle rendering.
    return [
      'span',
      mergeAttributes(HTMLAttributes, { // Use raw HTMLAttributes from options for base
        'data-type': 'multi-option', // Ensure this is present for parsing
        'data-node-type': 'multi-option',
        'data-options': node.attrs.options,
        'data-current-value': node.attrs.currentValue,
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

  addCommands() {
    return {
      insertMultiOption: (attributes?: { options?: string[]; currentValue?: string; nodeId?: string }) => ({ commands }: any) => {
        const nodeId = attributes?.nodeId || `multi-${Date.now()}`;
        const options = attributes?.options || ['Option 1', 'Option 2'];
        const optionsString = options.join('|');
        const currentValue = attributes?.currentValue || options[0];
        
        return commands.insertContent({
          type: this.name,
          attrs: { options: optionsString, currentValue, nodeId },
        });
      },

      updateMultiOptionNode: (nodeId: string, attrs: { options?: string[]; currentValue?: string }) => ({ tr, state }: any) => {
        let updated = false;
        state.doc.descendants((node: any, pos: number) => {
          if (node.type.name === 'multiOption' && node.attrs.nodeId === nodeId) {
            const newAttrs = { ...node.attrs };
            
            if (attrs.options) {
              newAttrs.options = attrs.options.join('|');
              // If current value is not in new options, set to first option
              if (!attrs.options.includes(node.attrs.currentValue)) {
                newAttrs.currentValue = attrs.options[0] || '';
              }
            }
            
            if (attrs.currentValue !== undefined) {
              newAttrs.currentValue = attrs.currentValue;
            }
            
            tr.setNodeMarkup(pos, undefined, newAttrs);
            updated = true;
            return false; // stop iteration
          }
        });
        return updated;
      },
    } as any;
  },
});
