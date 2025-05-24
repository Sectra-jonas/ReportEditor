// src/components/editor/nodeviews/WysiwygMultiOptionView.tsx
import React from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils'; // Assuming cn utility for classnames

interface Option {
  text: string;
  // Potentially other properties like 'value' in the future
}

const WysiwygMultiOptionViewComponent: React.FC<NodeViewProps> = ({ node, selected, HTMLAttributes }) => {
  // Ensure attrs are defined and provide fallbacks
  const fieldName = node.attrs.fieldName || 'Multi-Option Field';
  const options: Option[] = node.attrs.options || [];

  const optionsText = options.length > 0
    ? options.map((opt: Option) => opt.text).join(' | ')
    : 'No options defined';

  return (
    <NodeViewWrapper
      {...HTMLAttributes} // Pass through HTML attributes like class, style, etc.
      className={cn(
        'inline-block m-[2px] p-2 rounded border text-sm', // Base styling: m-0.5 before, now m-[2px]; p-1.5 before, now p-2
        'transition-all duration-100 ease-in-out', // Smooth transition for selection state changes
        'cursor-default', // Default cursor, can be overridden by data-drag-handle
        {
          'bg-purple-100 border-purple-500 ring-1 ring-purple-500': selected, // Style for selected state
          'bg-gray-100 border-gray-300 hover:border-gray-400': !selected, // Style for non-selected state
        }
      )}
      data-drag-handle // Makes the entire node draggable
    >
      <div className="font-medium text-gray-800">{fieldName}</div>
      <div className="text-xs text-gray-600 mt-1">
        Options: <span className="italic">{optionsText}</span>
      </div>
    </NodeViewWrapper>
  );
};

export default WysiwygMultiOptionViewComponent;
