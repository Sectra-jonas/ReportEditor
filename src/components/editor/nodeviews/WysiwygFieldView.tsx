// src/components/editor/nodeviews/WysiwygFieldView.tsx
import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils'; // Assuming cn utility for classnames

const WysiwygFieldViewComponent: React.FC<NodeViewProps> = ({ node, selected, HTMLAttributes }) => {
  // Ensure attrs are defined and provide fallbacks if necessary
  const fieldName = node.attrs.fieldName || 'Untitled Field';
  const defaultText = node.attrs.defaultText; // Can be an empty string

  return (
    <NodeViewWrapper
      {...HTMLAttributes} // Pass through HTML attributes like class, style, etc.
      className={cn(
        'inline-block m-[2px] p-1.5 rounded border text-sm', // Base styling: m-0.5 before, now m-[2px]; p-1 before, now p-1.5
        'transition-all duration-100 ease-in-out', // Smooth transition for selection state changes
        'cursor-default', // Default cursor, can be overridden by data-drag-handle
        {
          'bg-blue-100 border-blue-500 ring-1 ring-blue-500': selected, // Style for selected state
          'bg-gray-100 border-gray-300 hover:border-gray-400': !selected, // Style for non-selected state
        }
      )}
      data-drag-handle // Makes the entire node draggable
    >
      {defaultText ? (
        <span className="text-gray-800">{defaultText}</span>
      ) : (
        <span className="italic text-gray-500">{fieldName}</span>
      )}
    </NodeViewWrapper>
  );
};

export default WysiwygFieldViewComponent;
