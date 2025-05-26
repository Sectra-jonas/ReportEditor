import { Node, mergeAttributes, CommandProps } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';

export interface MultiLineFieldOptions {
  HTMLAttributes: Record<string, any>;
}

export const MultiLineFieldNode = Node.create<MultiLineFieldOptions>({
  name: 'multiLineField',
  group: 'block',
  content: 'block+', // Allow multiple block elements (paragraphs)
  defining: true,
  isolating: true,
  selectable: true,
  atom: false,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'multi-line-field-node bg-accent/50 hover:bg-primary/30 p-2 rounded-md border border-input mx-0.5 my-1 cursor-text transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1',
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
        tag: 'div[data-type="multi-line-field"]',
        getAttrs: (dom: HTMLElement) => {
          const fieldName = dom.getAttribute('data-field-name');
          if (fieldName) {
            return { fieldName };
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-type': 'multi-line-field',
      'data-node-type': 'multi-line-field'
    }), 0];
  },

  addCommands() {
    return {
      insertMultiLineField: (attributes?: { fieldName?: string; defaultText?: string; nodeId?: string }) => ({ commands, state }: CommandProps) => {
        const nodeId = attributes?.nodeId || `multi-line-field-${Date.now()}`;
        const fieldName = attributes?.fieldName || 'Field';
        const defaultText = attributes?.defaultText || fieldName;
        
        // Create content with a paragraph containing the default text
        const content = [
          {
            type: 'paragraph',
            content: defaultText ? [{ type: 'text', text: defaultText }] : []
          }
        ];
        
        return commands.insertContent({
          type: this.name,
          attrs: { fieldName, defaultText, nodeId },
          content
        });
      },

      convertToMultiLineField: () => ({ state, tr, dispatch }: CommandProps) => {
        const { selection } = state;
        const { $from, $to } = selection;
        
        // Find the nearest fieldName node
        let fieldNode: ProseMirrorNode | null = null;
        let fieldPos = -1;
        
        state.doc.nodesBetween($from.pos, $to.pos, (node: ProseMirrorNode, pos: number) => {
          if (node.type.name === 'fieldName') {
            fieldNode = node;
            fieldPos = pos;
            return false;
          }
        });
        
        if (!fieldNode || fieldPos === -1) return false;
        
        // Create a new multi-line field with the same attributes
        const multiLineField = state.schema.nodes.multiLineField.create(
          {
            fieldName: (fieldNode as any).attrs.fieldName,
            defaultText: (fieldNode as any).attrs.defaultText,
            nodeId: (fieldNode as any).attrs.nodeId || `multi-line-field-${Date.now()}`
          },
          [
            state.schema.nodes.paragraph.create(
              {},
              (fieldNode as any).content.size > 0 ? (fieldNode as any).content : state.schema.text((fieldNode as any).attrs.fieldName)
            )
          ]
        );
        
        if (dispatch) {
          tr.replaceRangeWith(fieldPos, fieldPos + (fieldNode as any).nodeSize, multiLineField);
          dispatch(tr);
        }
        
        return true;
      }
    } as any;
  },

  addKeyboardShortcuts() {
    return {
      // Allow Enter key to create new paragraphs within the field
      'Enter': ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        
        // Check if we're inside a multi-line field
        let inMultiLineField = false;
        for (let i = $from.depth; i >= 0; i--) {
          if ($from.node(i).type.name === 'multiLineField') {
            inMultiLineField = true;
            break;
          }
        }
        
        if (!inMultiLineField) return false;
        
        // Let the default Enter behavior work (splits paragraph)
        return false;
      },
      
      // Shift+Enter to convert a regular field to multi-line field
      'Shift-Enter': ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        
        // Check if we're inside a regular fieldName node
        let inFieldName = false;
        for (let i = $from.depth; i >= 0; i--) {
          if ($from.node(i).type.name === 'fieldName') {
            inFieldName = true;
            break;
          }
        }
        
        if (inFieldName) {
          return (editor.commands as any).convertToMultiLineField();
        }
        
        return false;
      }
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('multiLineFieldPlugin'),
        props: {
          handleKeyDown(view, event) {
            // Prevent field from being deleted when empty
            if (event.key === 'Backspace' || event.key === 'Delete') {
              const { state } = view;
              const { selection } = state;
              const { $from } = selection;
              
              // Check if we're at the start of a multi-line field
              let fieldNode = null;
              let fieldDepth = -1;
              
              for (let i = $from.depth; i >= 0; i--) {
                if ($from.node(i).type.name === 'multiLineField') {
                  fieldNode = $from.node(i);
                  fieldDepth = i;
                  break;
                }
              }
              
              if (fieldNode && fieldDepth >= 0) {
                // Check if the field would be empty after deletion
                const fieldStart = $from.start(fieldDepth);
                const fieldEnd = $from.end(fieldDepth);
                
                // If we're at the very start of the field and it only has one empty paragraph
                if ($from.pos === fieldStart + 1 && 
                    fieldNode.content.size === 2 && // empty paragraph = size 2
                    fieldNode.content.firstChild?.type.name === 'paragraph' &&
                    fieldNode.content.firstChild.content.size === 0) {
                  // Prevent deletion
                  return true;
                }
              }
            }
            
            return false;
          }
        }
      })
    ];
  }
});