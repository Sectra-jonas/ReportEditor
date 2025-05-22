import React, { useCallback, useEffect, useRef } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils'; // Assuming @/ maps to src/

export const FieldNameNodeView: React.FC<NodeViewProps> = ({ node, editor, updateAttributes, getPos }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (editor.isEditable) {
      updateAttributes({ fieldName: event.target.value });
    }
  }, [editor, updateAttributes]);

  // Auto-resize input width based on content
  useEffect(() => {
    if (inputRef.current) {
      // Temporarily make it auto to get the scroll width
      inputRef.current.style.width = 'auto';
      const scrollWidth = inputRef.current.scrollWidth;
      // Set width to scrollWidth or a minimum width
      inputRef.current.style.width = `${Math.max(scrollWidth, 50)}px`; 
    }
  }, [node.attrs.fieldName, editor.isEditable]);


  return (
    <NodeViewWrapper 
      as="span" 
      className={cn(
        'inline-block field-name-node-view mx-px align-baseline', // Ensure it aligns with text
        !editor.isEditable && 'opacity-80 cursor-default'
      )}
      draggable="true" // Make the wrapper draggable
      data-drag-handle // Tiptap's way to specify drag handle
    >
      <input
        ref={inputRef}
        type="text"
        value={node.attrs.fieldName}
        onChange={handleChange}
        disabled={!editor.isEditable}
        className={cn(
          // Base styles similar to ui/input.tsx but adapted for inline use
          "h-auto min-h-[calc(1.5em+0.5rem)]", // Match line height + padding
          "text-base", // Match surrounding text size
          "p-1", // Minimal padding
          "border border-input rounded-sm",
          "bg-transparent", // Transparent background to blend in
          "focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring", // Focus state
          !editor.isEditable && "border-transparent", // No border when not editable for flatter look
          "transition-all duration-150 ease-in-out" // Smooth transitions
        )}
        // Stop propagation to prevent Tiptap from selecting the node on click,
        // ensuring the input field itself gets focus.
        onMouseDown={(e) => {
          e.stopPropagation();
          if (editor.isEditable && inputRef.current) {
            // Focus and select text for easier editing
            // inputRef.current.focus(); 
            // inputRef.current.select();
          }
        }}
        onClick={(e) => {
            // Further ensure input focus
            e.stopPropagation();
             if (editor.isEditable && inputRef.current) {
                // inputRef.current.focus();
             }
        }}
        onFocus={(e) => {
            // When focused, ensure the editor doesn't try to select the node
            // This can sometimes be an issue with atom nodes.
            editor.commands.setNodeSelection(getPos());
        }}
        style={{
          // Dynamic width based on content, plus a little padding
          // Initial width is auto, then adjusted by useEffect
          minWidth: '50px', 
          maxWidth: '300px', // Prevent excessively long inputs
          display: 'inline-block', // Ensure it behaves like an inline element
          verticalAlign: 'baseline', // Align with surrounding text
        }}
      />
    </NodeViewWrapper>
  );
};
