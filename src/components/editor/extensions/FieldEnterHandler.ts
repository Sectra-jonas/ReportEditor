import HardBreak from '@tiptap/extension-hard-break';

export const FieldEnterHandler = HardBreak.extend({
  name: 'fieldEnterHandler',
  
  priority: 1000, // High priority to run before other extensions

  addKeyboardShortcuts() {
    return {
      'Enter': ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        console.log('FieldEnterHandler: Enter key pressed');
        console.log('Parent node:', $from.parent.type.name);

        // Check if we're inside a fieldName node
        if ($from.parent.type.name === 'fieldName') {
          console.log('Inside field! Setting hard break');
          
          // Use the setHardBreak command from the HardBreak extension
          return editor.commands.setHardBreak();
        }

        // For all other contexts, let the default Enter behavior happen
        return false;
      },
      // Keep the default Shift-Enter behavior
      'Shift-Enter': () => this.editor.commands.setHardBreak(),
      'Mod-Enter': () => this.editor.commands.setHardBreak(),
    };
  },
});