import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import WysiwygMultiOptionViewComponent from '../nodeviews/WysiwygMultiOptionView';

export interface WysiwygMultiOptionOptionsInterface { // Changed interface name slightly to avoid conflict
  HTMLAttributes: Record<string, any>;
}

export const WysiwygMultiOptionNode = Node.create<WysiwygMultiOptionOptionsInterface>({
  name: 'wysiwygMultiOptionField', // Internal Tiptap name
  group: 'inline',
  inline: true,
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      fieldName: {
        default: 'Untitled Multi-Option',
        parseHTML: element => element.getAttribute('data-field-name'),
        renderHTML: attributes => ({ 'data-field-name': attributes.fieldName }),
      },
      options: {
        default: [{ text: 'Option 1' }, { text: 'Option 2' }],
        parseHTML: element => {
          const optionsAttr = element.getAttribute('data-options');
          try {
            // Ensure that if optionsAttr is null or empty, we return the default.
            return optionsAttr ? JSON.parse(optionsAttr) : this.options.default;
          } catch (e) {
            console.error('Error parsing options for WysiwygMultiOptionNode:', e);
            // Return default if parsing fails
            return this.options.default;
          }
        },
        renderHTML: attributes => ({ 'data-options': JSON.stringify(attributes.options) }),
      },
      fieldId: {
        default: null,
        parseHTML: element => element.getAttribute('data-field-id'),
        // Only render 'data-field-id' if fieldId is not null
        renderHTML: attributes => (attributes.fieldId ? { 'data-field-id': attributes.fieldId } : {}),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="wysiwyg-multi-option-field"]',
        // Optional: getAttrs to refine attribute parsing if needed,
        // especially if defaults are not handled well by parseHTML alone.
        // getAttrs: dom => {
        //   const domNode = dom as HTMLElement;
        //   const optionsAttr = domNode.getAttribute('data-options');
        //   let parsedOptions;
        //   try {
        //     parsedOptions = optionsAttr ? JSON.parse(optionsAttr) : undefined; // Explicitly undefined if not present
        //   } catch (e) {
        //     console.error('Error parsing options in getAttrs:', e);
        //     parsedOptions = undefined; // Or some default fallback
        //   }
        //   return {
        //     fieldName: domNode.getAttribute('data-field-name'), // Default will be applied if null
        //     options: parsedOptions, // Default will be applied if undefined
        //     fieldId: domNode.getAttribute('data-field-id'), // Default will be applied if null
        //   };
        // },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    // HTMLAttributes here are the ones coming from the node's attrs (like fieldName, options as data-attributes)
    // this.options.HTMLAttributes are global attributes for this node type
    // We also add our specific data-type attribute.
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'wysiwyg-multi-option-field' }), 0];
    // The '0' indicates an empty content hole, as this is an atom node.
    // The NodeView will handle the actual presentation.
  },

  addNodeView() {
    return ReactNodeViewRenderer(WysiwygMultiOptionViewComponent);
  },
});

export default WysiwygMultiOptionNode;
