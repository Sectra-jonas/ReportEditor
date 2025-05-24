import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import WysiwygFieldViewComponent from '../nodeviews/WysiwygFieldView';

export interface WysiwygFieldOptions {
  HTMLAttributes: Record<string, any>;
}

//Declare the node extension
export const WysiwygFieldNode = Node.create<WysiwygFieldOptions>({
  name: 'wysiwygField',
  group: 'inline',
  inline: true,
  atom: true, // No content within the node itself in the document
  draggable: true,

  addAttributes() {
    return {
      fieldName: {
        default: 'Untitled Field',
        parseHTML: element => element.getAttribute('data-field-name'),
        renderHTML: attributes => ({ 'data-field-name': attributes.fieldName }),
      },
      defaultText: {
        default: '',
        parseHTML: element => element.getAttribute('data-default-text') || element.textContent,
        renderHTML: attributes => ({ 'data-default-text': attributes.defaultText }),
      },
      // Adding a unique ID to each field to help with rendering and state management.
      fieldId: {
        default: null,
        parseHTML: element => element.getAttribute('data-field-id'),
        renderHTML: attributes => ({ 'data-field-id': attributes.fieldId }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="wysiwyg-field"]',
        // Optional: A getAttrs function to refine attribute parsing if needed
        // getAttrs: dom => {
        //   const domNode = dom as HTMLElement;
        //   return {
        //     fieldName: domNode.getAttribute('data-field-name'),
        //     defaultText: domNode.getAttribute('data-default-text') || domNode.textContent,
        //     fieldId: domNode.getAttribute('data-field-id'),
        //   };
        // },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    // The renderHTML here provides the wrapper span with data attributes.
    // The actual visual representation including the defaultText will be handled by the NodeView.
    // We merge `this.options.HTMLAttributes` which might contain global classes or styles for this node type,
    // with `HTMLAttributes` which are the specific attributes for this instance (like fieldName, defaultText).
    // The `node.attrs.defaultText` is not directly rendered here as text content of the span,
    // because `atom: true` nodes typically have their content fully managed by their NodeView.
    // However, including `data-default-text` ensures it's available in the HTML if needed.
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {'data-type': 'wysiwyg-field'}), 0];
    // The '0' indicates an empty content hole, standard for atom nodes.
    // The NodeView will be responsible for rendering what appears *inside* this span.
  },

  addNodeView() {
    return ReactNodeViewRenderer(WysiwygFieldViewComponent);
  },
});

export default WysiwygFieldNode;
