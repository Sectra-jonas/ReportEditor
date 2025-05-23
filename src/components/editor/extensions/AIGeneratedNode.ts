import { Node, mergeAttributes } from '@tiptap/core';

export const AIGeneratedNode = Node.create({
  name: 'ai-generated',

  group: 'inline',
  inline: true,
  selectable: false,
  atom: false,
  content: 'text*',

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
        tag: 'span[data-ai-generated="true"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-ai-generated': 'true',
        class: 'bg-blue-100 dark:bg-blue-900/30 px-1 rounded',
      }),
      0,
    ];
  },
});