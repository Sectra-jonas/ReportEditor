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
import { Type, ListChecks, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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

  // Generic attribute change handler
  const handleAttributeChange = (fieldId: string, attrName: string, value: string) => {
    onUpdateNodeAttributes(fieldId, { [attrName]: value });
  };

  // Handlers for 'multiOption' (pipe-separated string options)
  const handlePipeOptionTextChange = (
    fieldId: string,
    optionIndex: number,
    newText: string,
    currentOptionsString: string,
    currentValue: string
  ) => {
    const optionsArray = currentOptionsString ? currentOptionsString.split('|') : [];
    const newOptionsArray = optionsArray.map((option, idx) =>
      idx === optionIndex ? newText : option
    );
    const newOptionsString = newOptionsArray.join('|');
    const newAttrs: Record<string, any> = { options: newOptionsString };

    // If the edited option was the currentValue, update currentValue as well
    if (optionsArray[optionIndex] === currentValue && newText !== currentValue) {
      newAttrs.currentValue = newText; // Update to the new text of the option
    }
    onUpdateNodeAttributes(fieldId, newAttrs);
  };

  const handleRemovePipeOption = (
    fieldId: string,
    optionIndex: number,
    currentOptionsString: string,
    currentValue: string
  ) => {
    const optionsArray = currentOptionsString ? currentOptionsString.split('|') : [];
    const removedOptionValue = optionsArray[optionIndex];
    const newOptionsArray = optionsArray.filter((_, idx) => idx !== optionIndex);
    const newOptionsString = newOptionsArray.join('|');
    const newAttrs: Record<string, any> = { options: newOptionsString };

    if (currentValue === removedOptionValue) {
      newAttrs.currentValue = newOptionsArray.length > 0 ? newOptionsArray[0] : '';
    }
    onUpdateNodeAttributes(fieldId, newAttrs);
  };

  const handleAddPipeOption = (
    fieldId: string,
    currentOptionsString: string
  ) => {
    const optionsArray = currentOptionsString ? currentOptionsString.split('|') : [];
    const newOptionText = `Option ${optionsArray.length + 1}`;
    const newOptionsArray = [...optionsArray, newOptionText];
    const newOptionsString = newOptionsArray.join('|');
    const newAttrs: Record<string, any> = { options: newOptionsString };

    // If it's the first option being added, also set it as currentValue
    if (optionsArray.length === 0) {
        newAttrs.currentValue = newOptionText;
    }
    onUpdateNodeAttributes(fieldId, newAttrs);
  };
  
  // Handler for currentValue, ensuring it's one of the available options
  const handleCurrentValueChange = (fieldId: string, newValue: string, currentOptionsString: string) => {
    const optionsArray = currentOptionsString ? currentOptionsString.split('|') : [];
    if (optionsArray.includes(newValue) || newValue === '') { // Allow empty if no options or explicitly set empty
         onUpdateNodeAttributes(fieldId, { currentValue: newValue });
    } else {
        // Optionally, provide feedback to user that value is invalid or auto-correct
        // For now, if invalid, we could choose not to update or default to first option
        if(optionsArray.length > 0) {
            onUpdateNodeAttributes(fieldId, { currentValue: optionsArray[0] });
        } else {
            onUpdateNodeAttributes(fieldId, { currentValue: '' });
        }
    }
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
            <SidebarGroupLabel className="text-sm font-medium text-gray-600 dark:text-gray-400">Fields</SidebarGroupLabel>
            <SidebarGroupContent className="mt-2 space-y-1">
              <DraggableFieldItem
                label="Text Field"
                fieldType="fieldName"
                icon={<Type className="w-4 h-4 mr-2.5 text-sky-600 flex-shrink-0" />}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, 'fieldName')}
              />
              <DraggableFieldItem
                label="Multi-Option Field"
                fieldType="multiOption"
                icon={<ListChecks className="w-4 h-4 mr-2.5 text-purple-600 flex-shrink-0" />}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, 'multiOption')}
              />
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-4" />

          <SidebarGroup>
            <SidebarGroupLabel className="text-sm font-medium text-gray-600 dark:text-gray-400">Properties</SidebarGroupLabel>
            <SidebarGroupContent className="p-0 mt-1 space-y-4">
              {selectedNode && (selectedNode.type === 'wysiwygField' || selectedNode.type === 'fieldName') ? (
                <>
                  <div className="px-1">
                    <Label htmlFor={`prop-fieldName-${selectedNode.id}`} className="text-xs">Field Name</Label>
                    <Input
                      id={`prop-fieldName-${selectedNode.id}`}
                      type="text"
                      value={selectedNode.attrs.fieldName || ''}
                      onChange={(e) => handleAttributeChange(selectedNode.id, 'fieldName', e.target.value)}
                      placeholder="Enter field name"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  {selectedNode.type === 'wysiwygField' && (
                    <div className="px-1">
                      <Label htmlFor={`prop-defaultText-${selectedNode.id}`} className="text-xs">Default Text</Label>
                      <Input
                        id={`prop-defaultText-${selectedNode.id}`}
                        type="text"
                        value={selectedNode.attrs.defaultText || ''}
                        onChange={(e) => handleAttributeChange(selectedNode.id, 'defaultText', e.target.value)}
                        placeholder="Enter default text (optional)"
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                  )}
                </>
              ) : selectedNode && (selectedNode.type === 'wysiwygMultiOptionField' || selectedNode.type === 'multiOption') ? (
                <div className="space-y-3 px-1">
                  <div>
                    <Label htmlFor={`prop-multiFieldName-${selectedNode.id}`} className="text-xs">Field Name</Label>
                    <Input
                      id={`prop-multiFieldName-${selectedNode.id}`}
                      type="text"
                      value={selectedNode.attrs.fieldName || ''}
                      onChange={(e) => handleAttributeChange(selectedNode.id, 'fieldName', e.target.value)}
                      placeholder="Enter field name"
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  
                  {/* UI for 'multiOption' (pipe-separated string options) */}
                  {selectedNode.type === 'multiOption' && (
                    <>
                      <div>
                        <Label className="text-xs block mb-1">Options</Label>
                        {(selectedNode.attrs.options ? selectedNode.attrs.options.split('|') : []).map((optionText: string, index: number) => (
                          <div key={index} className="flex items-center space-x-2 mb-2">
                            <Input
                              id={`pipeOptionText-${selectedNode.id}-${index}`}
                              value={optionText}
                              onChange={(e) => handlePipeOptionTextChange(selectedNode.id, index, e.target.value, selectedNode.attrs.options || '', selectedNode.attrs.currentValue || '')}
                              placeholder={`Option ${index + 1} text`}
                              className="flex-grow h-8 text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemovePipeOption(selectedNode.id, index, selectedNode.attrs.options || '', selectedNode.attrs.currentValue || '')}
                              aria-label="Remove option"
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddPipeOption(selectedNode.id, selectedNode.attrs.options || '')}
                          className="mt-2 w-full h-8 text-sm"
                        >
                          Add Option
                        </Button>
                      </div>
                      <div>
                        <Label htmlFor={`prop-currentValue-${selectedNode.id}`} className="text-xs mt-2 block">Current Value</Label>
                        <Input
                           id={`prop-currentValue-${selectedNode.id}`}
                           type="text"
                           value={selectedNode.attrs.currentValue || ''}
                           onChange={(e) => handleCurrentValueChange(selectedNode.id, e.target.value, selectedNode.attrs.options || '')}
                           placeholder="Current selected option"
                           className="mt-1 h-8 text-sm"
                        />
                      </div>
                    </>
                  )}

                  {/* UI for 'wysiwygMultiOptionField' (array of objects options) - Kept for compatibility if needed */}
                  {selectedNode.type === 'wysiwygMultiOptionField' && (
                    <div>
                      <Label className="text-xs block mb-1">Options (Legacy)</Label>
                      {(selectedNode.attrs.options || []).map((option: { text: string }, index: number) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <Input
                            value={option.text} // This part needs legacy handlers if it's to be editable
                            readOnly // For now, make legacy display read-only to avoid conflict
                            className="flex-grow h-8 text-sm bg-gray-100 dark:bg-gray-700" // Added dark mode for readonly legacy
                          />
                        </div>
                      ))}
                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Legacy format, edit as new 'Multi-Option Field' for full controls.</p> {/* Adjusted legacy text color */}
                    </div>
                  )}
                </div>
              ) : (
                <p className="px-2 text-xs text-gray-500 dark:text-gray-400"> {/* Adjusted placeholder text color */}
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
