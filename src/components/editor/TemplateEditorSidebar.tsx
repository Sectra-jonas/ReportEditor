// src/components/editor/TemplateEditorSidebar.tsx
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import DraggableFieldItem from './DraggableFieldItem';
import { Type, ListChecks, X } from 'lucide-react'; // Added X icon
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button'; // Added Button
import type { SelectedNodeInfo } from './TemplateEditor';

interface TemplateEditorSidebarProps {
  selectedNode: SelectedNodeInfo | null;
  onUpdateNodeAttributes: (fieldId: string, newAttrs: Record<string, any>) => void;
}

const TemplateEditorSidebar: React.FC<TemplateEditorSidebarProps> = ({
  selectedNode,
  onUpdateNodeAttributes,
}) => {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, fieldType: string) => {
    event.dataTransfer.setData('application/json', JSON.stringify({ type: fieldType }));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleAttributeChange = (fieldId: string, attrName: string, value: string) => {
    onUpdateNodeAttributes(fieldId, { [attrName]: value });
  };

  // Specific handlers for multi-option field options
  const handleOptionTextChange = (
    fieldId: string,
    optionIndex: number,
    newText: string,
    currentOptions: Array<{ text: string }>
  ) => {
    const newOptions = currentOptions.map((option, idx) =>
      idx === optionIndex ? { ...option, text: newText } : option
    );
    onUpdateNodeAttributes(fieldId, { options: newOptions });
  };

  const handleRemoveOption = (
    fieldId: string,
    optionIndex: number,
    currentOptions: Array<{ text: string }>
  ) => {
    const newOptions = currentOptions.filter((_, idx) => idx !== optionIndex);
    onUpdateNodeAttributes(fieldId, { options: newOptions });
  };

  const handleAddOption = (
    fieldId: string,
    currentOptions: Array<{ text: string }>
  ) => {
    const newOptions = [...currentOptions, { text: `Option ${currentOptions.length + 1}` }];
    onUpdateNodeAttributes(fieldId, { options: newOptions });
  };


  return (
    <Sidebar
      side="right"
      variant="sidebar"
      className={cn('w-80 border-l')}
      collapsible="none"
    >
      <SidebarHeader className="p-4">
        <h2 className="text-lg font-semibold text-foreground">Template Configuration</h2>
      </SidebarHeader>
      <ScrollArea className="flex-grow">
        <SidebarContent className="p-4 pt-0">
          <SidebarGroup>
            <SidebarGroupLabel className="text-sm font-medium text-muted-foreground">Fields</SidebarGroupLabel>
            <SidebarGroupContent className="mt-2 space-y-1">
              <DraggableFieldItem
                label="Text Field"
                fieldType="wysiwygField"
                icon={<Type className="w-4 h-4 mr-2.5 text-sky-600 flex-shrink-0" />}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, 'wysiwygField')}
              />
              <DraggableFieldItem
                label="Multi-Option Field"
                fieldType="wysiwygMultiOptionField"
                icon={<ListChecks className="w-4 h-4 mr-2.5 text-purple-600 flex-shrink-0" />}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, 'wysiwygMultiOptionField')}
              />
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-4" />

          <SidebarGroup>
            <SidebarGroupLabel className="text-sm font-medium text-muted-foreground">Properties</SidebarGroupLabel>
            <SidebarGroupContent className="p-0 mt-1 space-y-4"> {/* Increased space-y for better separation */}
              {selectedNode && selectedNode.type === 'wysiwygField' ? (
                <>
                  <div className="px-1"> {/* Added padding for consistency */}
                    <Label htmlFor="fieldName" className="text-xs">Field Name</Label>
                    <Input
                      id="fieldName"
                      type="text"
                      value={selectedNode.attrs.fieldName || ''}
                      onChange={(e) => handleAttributeChange(selectedNode.id, 'fieldName', e.target.value)}
                      placeholder="Enter field name"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div className="px-1"> {/* Added padding for consistency */}
                    <Label htmlFor="defaultText" className="text-xs">Default Text</Label>
                    <Input
                      id="defaultText"
                      type="text"
                      value={selectedNode.attrs.defaultText || ''}
                      onChange={(e) => handleAttributeChange(selectedNode.id, 'defaultText', e.target.value)}
                      placeholder="Enter default text (optional)"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                </>
              ) : selectedNode && selectedNode.type === 'wysiwygMultiOptionField' ? (
                <div className="space-y-3 px-1"> {/* Added padding and spacing */}
                  <div>
                    <Label htmlFor={`multiFieldName-${selectedNode.id}`} className="text-xs">Field Name</Label>
                    <Input
                      id={`multiFieldName-${selectedNode.id}`} // Unique ID for label association
                      type="text"
                      value={selectedNode.attrs.fieldName || ''}
                      onChange={(e) => handleAttributeChange(selectedNode.id, 'fieldName', e.target.value)}
                      placeholder="Enter field name"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs block mb-1">Options</Label>
                    {(selectedNode.attrs.options || []).map((option: { text: string }, index: number) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <Input
                          id={`optionText-${selectedNode.id}-${index}`} // Unique ID
                          value={option.text}
                          onChange={(e) => handleOptionTextChange(selectedNode.id, index, e.target.value, selectedNode.attrs.options || [])}
                          placeholder={`Option ${index + 1} text`}
                          className="flex-grow h-8 text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(selectedNode.id, index, selectedNode.attrs.options || [])}
                          aria-label="Remove option"
                          className="h-8 w-8" // Ensure consistent size with input height
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddOption(selectedNode.id, selectedNode.attrs.options || [])}
                      className="mt-2 w-full h-8 text-sm" // Full width, consistent height
                    >
                      Add Option
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="px-2 text-xs text-muted-foreground">
                  Select a field on the template to view and edit its properties here.
                </p>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </ScrollArea>
    </Sidebar>
  );
};

export default TemplateEditorSidebar;
