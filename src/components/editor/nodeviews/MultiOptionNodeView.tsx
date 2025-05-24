
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } 
from '@tiptap/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

export const MultiOptionNodeView: React.FC<NodeViewProps> = ({ editor, node, getPos, updateAttributes, selected }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const optionsString = node.attrs.options as string || "";
  const options = optionsString.split('|').map(opt => opt.trim()).filter(opt => opt.length > 0);
  const currentValue = node.attrs.currentValue as string || options[0] || "Select";

  const handleSelectOption = useCallback((option: string) => {
    if (editor.isEditable) {
      updateAttributes({ currentValue: option });
    }
    setIsOpen(false);
  }, [editor, updateAttributes]);

  const handleStartEdit = useCallback(() => {
    if (editor.isEditable) {
      setEditValue(currentValue);
      setIsEditing(true);
      setIsOpen(false);
    }
  }, [editor.isEditable, currentValue]);

  const handleFinishEdit = useCallback(() => {
    if (editValue.trim() && editValue !== currentValue) {
      updateAttributes({ currentValue: editValue.trim() });
    }
    setIsEditing(false);
  }, [editValue, currentValue, updateAttributes]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
    }
  }, [handleFinishEdit]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (!editor) return null;

  return (
    <NodeViewWrapper
      as="span"
      className={`multi-option-node group inline-flex items-center bg-accent text-accent-foreground p-1 rounded-sm mx-0.5 cursor-pointer relative transition-colors hover:bg-primary/80
        ${selected ? 'ring-2 ring-ring ring-offset-1' : 'border border-input'}
        ${!editor.isEditable ? 'cursor-default opacity-80' : ''}
      `}
      draggable="true" 
      data-drag-handle
      data-node-id={node.attrs.nodeId}
      data-node-type="multi-option"
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleFinishEdit}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none text-accent-foreground min-w-[60px] w-auto"
          style={{ width: `${Math.max(editValue.length * 8, 60)}px` }}
        />
      ) : (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger
            asChild
            disabled={!editor.isEditable}
            onClick={(e) => {
              if (editor.isEditable) {
                e.preventDefault(); 
                setIsOpen(prev => !prev);
              }
            }}
            onKeyDown={(e) => { 
              if (editor.isEditable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setIsOpen(prev => !prev);
              }
            }}
          >
            <span 
              className="flex items-center select-none" 
              role="button" 
              tabIndex={editor.isEditable ? 0 : -1}
              onDoubleClick={handleStartEdit}
            >
              {currentValue}
              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </span>
          </PopoverTrigger>
          {editor.isEditable && (
            <PopoverContent 
              className="w-auto p-0 mt-1 z-[60]"
              side="bottom" 
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()} 
              onCloseAutoFocus={(e) => e.preventDefault()} 
            >
              <div className="flex flex-col max-h-60 overflow-y-auto rounded-md border bg-popover shadow-md">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start rounded-none border-b border-border text-xs text-muted-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    handleStartEdit();
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  ✏️ Edit text...
                </Button>
                {options.length > 0 ? options.map((option) => (
                  <Button
                    key={option}
                    variant="ghost"
                    size="sm"
                    className="justify-start rounded-none"
                    onClick={(e) => {
                      e.preventDefault(); 
                      handleSelectOption(option);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
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
      )}
    </NodeViewWrapper>
  );
};

