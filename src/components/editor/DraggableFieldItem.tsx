// src/components/editor/DraggableFieldItem.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface DraggableFieldItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  fieldType: string; // e.g., 'wysiwygField', 'wysiwygMultiOptionField'
  icon?: React.ReactNode;
  // onDragStart is now part of HTMLAttributes<HTMLDivElement>
}

const DraggableFieldItem: React.FC<DraggableFieldItemProps> = ({
  label,
  fieldType, // fieldType is not directly used here but good for prop consistency if needed later
  icon,
  className,
  ...props // Spread the rest of the props, including onDragStart and draggable
}) => {
  return (
    <div
      {...props} // Spreads draggable, onDragStart, etc.
      className={cn(
        'flex items-center p-2.5 mb-2 border border-gray-300 rounded-md cursor-grab active:cursor-grabbing', // Explicit light mode border
        'bg-card hover:bg-muted transition-colors duration-150 ease-in-out shadow-sm',
        'dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-600', // Adjusted dark mode border for consistency (slate-700 was a bit dark for border with bg-slate-800)
        className
      )}
    >
      {icon || <GripVertical className="w-5 h-5 mr-3 text-muted-foreground flex-shrink-0" />}
      <span className="text-sm font-medium text-card-foreground dark:text-slate-200">{label}</span>
    </div>
  );
};

export default DraggableFieldItem;
