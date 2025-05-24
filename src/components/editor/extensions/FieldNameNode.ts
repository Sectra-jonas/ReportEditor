
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
      defaultText: {
        default: '',
        parseHTML: element => element.getAttribute('data-default-text'),
        renderHTML: attributes => ({
          'data-default-text': attributes.defaultText,
        }),
      },
      nodeId: {
        default: null,
        parseHTML: element => element.getAttribute('data-node-id'),
        renderHTML: attributes => ({
          'data-node-id': attributes.nodeId,
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
      'data-type': 'field-name',
      'data-node-type': 'field'
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
            
            const newNode = this.type.create(
              { fieldName: fieldNameText, defaultText: fieldNameText },
              state.schema.text(fieldNameText)
            );
            tr.insert(start, newNode);
            // Add a space after the field to ensure cursor can be placed after it
            const spaceNode = state.schema.text(' ');
            tr.insert(start + newNode.nodeSize, spaceNode);
          }
        },
      }),
    ];
  },

  addCommands() {
    return {
      insertField: (attributes?: { fieldName?: string; defaultText?: string; nodeId?: string }) => ({ commands }: any) => {
        const nodeId = attributes?.nodeId || `field-${Date.now()}`;
        const fieldName = attributes?.fieldName || 'Field';
        const defaultText = attributes?.defaultText || fieldName;
        
        return commands.insertContent([
          {
            type: this.name,
            attrs: { fieldName, defaultText, nodeId },
            content: [{ type: 'text', text: defaultText }],
          },
          {
            type: 'text',
            text: ' ',
          }
        ]);
      },

      updateFieldNode: (nodeId: string, attrs: { fieldName?: string; defaultText?: string }) => ({ tr, state }: any) => {
        let updated = false;
        state.doc.descendants((node: any, pos: number) => {
          if (node.type.name === 'fieldName' && node.attrs.nodeId === nodeId) {
            const newAttrs = { ...node.attrs, ...attrs };
            const newText = attrs.defaultText !== undefined ? attrs.defaultText : node.attrs.defaultText;
            const displayText = newText || newAttrs.fieldName;
            
            // Create new node with updated content
            const newNode = state.schema.nodes.fieldName.create(
              newAttrs,
              displayText ? state.schema.text(displayText) : null
            );
            
            tr.replaceRangeWith(pos, pos + node.nodeSize, newNode);
            updated = true;
            return false; // stop iteration
          }
        });
        return updated;
      },
    } as any;
  },
});
