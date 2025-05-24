import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'

export const DragDropFieldExtension = Extension.create({
  name: 'dragDropField',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('dragDropField'),
        props: {
          handleDOMEvents: {
            drop(view: EditorView, event: DragEvent) {
              event.preventDefault()
              event.stopPropagation()

              const fieldType = event.dataTransfer?.getData('field-type') as 'field' | 'multi-option' | null
              if (!fieldType) return false

              const coordinates = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              })

              if (!coordinates) return false

              const { tr } = view.state
              const pos = coordinates.pos

              if (fieldType === 'field') {
                const nodeId = `field-${Date.now()}`
                const node = view.state.schema.nodes.fieldName.create({
                  fieldName: 'Field',
                  defaultText: '',
                  nodeId,
                })
                tr.insert(pos, node)
              } else if (fieldType === 'multi-option') {
                const nodeId = `multi-${Date.now()}`
                const node = view.state.schema.nodes.multiOption.create({
                  options: 'Option 1|Option 2',
                  currentValue: 'Option 1',
                  nodeId,
                })
                tr.insert(pos, node)
              }

              view.dispatch(tr)
              return true
            },

            dragover(view: EditorView, event: DragEvent) {
              event.preventDefault()
              event.dataTransfer!.dropEffect = 'copy'
              return false
            }
          },
        },
      }),
    ]
  },
})