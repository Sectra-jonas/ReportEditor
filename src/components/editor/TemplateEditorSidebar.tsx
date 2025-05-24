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
    <div className="w-80 h-full bg-slate-900 border-l border-slate-700 flex flex-col">
      {/* Fields Section */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold mb-3 text-slate-200">Fields</h3>
        <div className="space-y-2">
          <div
            draggable
            onDragStart={(e) => handleFieldDragStart(e, 'field')}
            className="flex items-center gap-2 p-3 border border-slate-600 bg-slate-800 rounded-md cursor-move hover:bg-slate-700 hover:border-slate-500 transition-colors"
          >
            <GripVertical className="h-4 w-4 text-slate-400" />
            <Type className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-slate-200">Field</span>
          </div>
          <div
            draggable
            onDragStart={(e) => handleFieldDragStart(e, 'multi-option')}
            className="flex items-center gap-2 p-3 border border-slate-600 bg-slate-800 rounded-md cursor-move hover:bg-slate-700 hover:border-slate-500 transition-colors"
          >
            <GripVertical className="h-4 w-4 text-slate-400" />
            <ToggleLeft className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-slate-200">Multi-Option Field</span>
          </div>
        </div>
      </div>

      <Separator className="bg-slate-700" />

      {/* Properties Section */}
      <div className="flex-1 p-4 overflow-hidden">
        <h3 className="text-sm font-semibold mb-3 text-slate-200">Properties</h3>
        
        {!selectedField ? (
          <p className="text-sm text-slate-400">
            Select a field in the editor to view its properties
          </p>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-4 pr-4">
              {selectedField.type === 'field' && (
                <div className="space-y-2">
                  <Label htmlFor="default-text" className="text-slate-200">Default Text</Label>
                  <Input
                    id="default-text"
                    value={selectedField.defaultText || ''}
                    onChange={(e) => handleDefaultTextChange(e.target.value)}
                    placeholder="Enter default text..."
                    className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
              )}

              {selectedField.type === 'multi-option' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-200">Options</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddOption}
                      className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-slate-500"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedField.options?.map((option, index) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm text-slate-400 w-8">
                            {index + 1}.
                          </span>
                          <Input
                            value={option.text}
                            onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                            placeholder="Option text..."
                            className="bg-slate-800 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-green-400 focus:ring-green-400"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveOption(option.id)}
                          disabled={selectedField.options?.length === 1}
                          className="text-slate-400 hover:text-red-400 hover:bg-slate-800"
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