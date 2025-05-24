import { Node, mergeAttributes } from '@tiptap/core';

export const AIGeneratedNode = Node.create({
  name: 'ai-generated',

  group: 'block',
  inline: false,
  selectable: false,
  atom: false,
  content: 'block*',

  addAttributes() {
    return {
      'data-ai-generated': {
        default: 'true',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-ai-generated="true"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-ai-generated': 'true',
        class: 'bg-primary/20 dark:bg-primary/15 border border-primary/40 p-4 rounded-lg my-3 border-l-4 border-l-primary shadow-sm relative before:content-["🤖_AI"] before:absolute before:top-2 before:right-3 before:text-xs before:font-semibold before:text-primary before:bg-background before:px-2 before:py-1 before:rounded before:border before:border-primary/30',
      }),
      0,
    ];
  },
});