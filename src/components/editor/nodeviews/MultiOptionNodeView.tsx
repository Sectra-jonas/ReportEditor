
"use client";

import React, { useState, useCallback } from 'react';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } // ReactRenderer 
from '@tiptap/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

export const MultiOptionNodeView: React.FC<NodeViewProps> = ({ editor, node, getPos, updateAttributes, selected }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Ensure attributes are correctly typed or provide fallbacks
  const optionsString = node.attrs.options as string || "";
  const options = optionsString.split('|').map(opt => opt.trim()).filter(opt => opt.length > 0);
  const currentValue = node.attrs.currentValue as string || options[0] || "Select";

  const handleSelectOption = useCallback((option: string) => {
    if (editor.isEditable) {
      updateAttributes({ currentValue: option });
    }
    setIsOpen(false);
    // editor.commands.focus(); // Re-focus editor can be disruptive if user wants to tab away.
  }, [editor, updateAttributes]);

  // Ensure component updates if node attributes change externally
  // This is implicitly handled by Tiptap + ReactRenderer for attribute changes.

  if (!editor) return null;

  return (
    <NodeViewWrapper
      as="span"
      className={`multi-option-node group inline-flex items-center bg-accent text-accent-foreground p-1 rounded-sm mx-0.5 cursor-pointer relative transition-colors hover:bg-primary/80
        ${selected ? 'ring-2 ring-ring ring-offset-1' : 'border border-input'}
        ${!editor.isEditable ? 'cursor-default opacity-80' : ''}
      `}
      draggable="true" // Standard for atom nodes
      data-drag-handle // Standard for atom nodes
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          asChild
          disabled={!editor.isEditable}
          onClick={(e) => {
            if (editor.isEditable) {
              e.preventDefault(); // Prevent editor focus issues
              setIsOpen(prev => !prev);
            }
          }}
          onKeyDown={(e) => { // Allow opening with Enter/Space when focused
            if (editor.isEditable && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setIsOpen(prev => !prev);
            }
          }}
        >
          <span className="flex items-center select-none" role="button" tabIndex={editor.isEditable ? 0 : -1}>
            {currentValue}
            <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </PopoverTrigger>
        {editor.isEditable && (
          <PopoverContent className="w-auto p-0 mt-1" side="bottom" align="start">
            <div className="flex flex-col max-h-60 overflow-y-auto">
              {options.length > 0 ? options.map((option) => (
                <Button
                  key={option}
                  variant="ghost"
                  size="sm"
                  className="justify-start rounded-none"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent any default editor behavior
                    handleSelectOption(option);
                  }}
                  onMouseDown={(e) => e.preventDefault()} // Helps prevent editor losing focus
                >
                  {option}
                </Button>
              )) : (
                <span className="text-sm text-muted-foreground p-2">No options</span>
              )}
            </div>
          </PopoverContent>
        )}
      </Popover>
    </NodeViewWrapper>
  );
};
