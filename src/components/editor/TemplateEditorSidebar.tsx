"use client"

import React, { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, GripVertical, Type, ToggleLeft } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface FieldOption {
  id: string
  text: string
}

interface SelectedField {
  type: 'field' | 'multi-option'
  nodeId: string
  defaultText?: string
  options?: FieldOption[]
}

interface TemplateEditorSidebarProps {
  selectedField: SelectedField | null
  onFieldUpdate: (field: SelectedField) => void
}

export function TemplateEditorSidebar({ selectedField, onFieldUpdate }: TemplateEditorSidebarProps) {
  const handleFieldDragStart = (e: React.DragEvent, type: 'field' | 'multi-option') => {
    e.dataTransfer.setData('field-type', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDefaultTextChange = (value: string) => {
    if (selectedField) {
      onFieldUpdate({
        ...selectedField,
        defaultText: value
      })
    }
  }

  const handleAddOption = () => {
    if (selectedField?.type === 'multi-option') {
      const newOption: FieldOption = {
        id: `option-${Date.now()}`,
        text: 'New Option'
      }
      onFieldUpdate({
        ...selectedField,
        options: [...(selectedField.options || []), newOption]
      })
    }
  }

  const handleRemoveOption = (optionId: string) => {
    if (selectedField?.type === 'multi-option') {
      onFieldUpdate({
        ...selectedField,
        options: selectedField.options?.filter(opt => opt.id !== optionId) || []
      })
    }
  }

  const handleOptionTextChange = (optionId: string, text: string) => {
    if (selectedField?.type === 'multi-option') {
      onFieldUpdate({
        ...selectedField,
        options: selectedField.options?.map(opt => 
          opt.id === optionId ? { ...opt, text } : opt
        ) || []
      })
    }
  }

  return (
    <div className="w-80 h-full bg-background border-l flex flex-col">
      {/* Fields Section */}
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold mb-3">Fields</h3>
        <div className="space-y-2">
          <div
            draggable
            onDragStart={(e) => handleFieldDragStart(e, 'field')}
            className="flex items-center gap-2 p-3 border rounded-md cursor-move hover:bg-accent/50 transition-colors"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <Type className="h-4 w-4" />
            <span className="text-sm font-medium">Field</span>
          </div>
          <div
            draggable
            onDragStart={(e) => handleFieldDragStart(e, 'multi-option')}
            className="flex items-center gap-2 p-3 border rounded-md cursor-move hover:bg-accent/50 transition-colors"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <ToggleLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Multi-Option Field</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Properties Section */}
      <div className="flex-1 p-4 overflow-hidden">
        <h3 className="text-sm font-semibold mb-3">Properties</h3>
        
        {!selectedField ? (
          <p className="text-sm text-muted-foreground">
            Select a field in the editor to view its properties
          </p>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-4 pr-4">
              {selectedField.type === 'field' && (
                <div className="space-y-2">
                  <Label htmlFor="default-text">Default Text</Label>
                  <Input
                    id="default-text"
                    value={selectedField.defaultText || ''}
                    onChange={(e) => handleDefaultTextChange(e.target.value)}
                    placeholder="Enter default text..."
                  />
                </div>
              )}

              {selectedField.type === 'multi-option' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Options</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddOption}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedField.options?.map((option, index) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-8">
                            {index + 1}.
                          </span>
                          <Input
                            value={option.text}
                            onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                            placeholder="Option text..."
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveOption(option.id)}
                          disabled={selectedField.options?.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}