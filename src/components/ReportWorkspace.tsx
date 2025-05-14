
"use client";

import RichTextEditor from '@/components/editor/RichTextEditor';
import EditorToolbar from '@/components/editor/EditorToolbar';
import { MainToolbar } from '@/components/layout/MainToolbar';
import { useReport } from '@/contexts/ReportContext';
import useVoiceRecognition from '@/hooks/useVoiceRecognition';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

const ReportWorkspace = () => {
  const { editor, setEditor, currentReport, isDirty, setIsDirty, createNewReport } = useReport();
  const { toast } = useToast();
  const lastInsertedTextRef = useRef<string | null>(null);

  const handleVoiceResult = (transcript: string, isFinal: boolean) => {
    if (editor && editor.isEditable) {
      if (isFinal) {
        // Append final transcript with a space
        const { from, to } = editor.state.selection;
        editor.chain().focus().insertContentAt({ from, to }, transcript + " ").run();
        lastInsertedTextRef.current = null; 
      } else {
        // Interim results can be complex to handle perfectly without specific markers.
        // A common approach is to show them in a temporary UI element.
        // For now, we'll avoid inserting interim results directly into the editor
        // to prevent text jumping or overwriting issues.
        // console.log("Interim transcript:", transcript);
        // lastInsertedTextRef.current = transcript; // Could be used for more advanced replacement later
      }
    }
  };
  
  const handleVoiceEnd = () => {
    // Voice recognition ended, already handled by isListening state change
  };

  const handleVoiceError = (error: any) => {
    toast({ title: "Voice Recognition Error", description: error.message || String(error), variant: "destructive" });
  };

  const { isListening, toggleListening, isSupported } = useVoiceRecognition({
    onResult: handleVoiceResult,
    onEnd: handleVoiceEnd,
    onError: handleVoiceError,
  });

  // Initialize with a new blank report if none exists on initial load
  useEffect(() => {
    if (!currentReport && editor) { // Check if editor is also initialized
       createNewReport();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]); // Depend on editor initialization

  const handleEditorUpdate = () => {
    if (!isDirty && editor && editor.isEditable) { // Only set dirty if editor is editable
        // Check if the update was programmatic or user-initiated.
        // Tiptap's 'transaction' object on update might have info.
        // For simplicity, any update while editable is considered to make it dirty.
        setIsDirty(true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <MainToolbar />
      <div className="flex flex-col flex-grow p-4 md:p-6 lg:p-8 overflow-hidden">
        <div className="flex flex-col flex-grow border border-input rounded-lg shadow-xl bg-card">
          <EditorToolbar 
            editor={editor} 
            isVoiceActive={isListening} 
            onToggleVoice={isSupported && editor?.isEditable ? toggleListening : undefined} 
            disableControls={!editor?.isEditable}
          />
          <div className="flex-grow h-full overflow-y-auto">
            <RichTextEditor
              content={currentReport?.content || ''}
              setEditorInstance={setEditor}
              onUpdate={handleEditorUpdate}
              editable={!!editor?.isEditable} // Controlled by editor instance state
              placeholder="Start your radiology report here... Use [FieldName] or [OptionA|OptionB] for template fields."
              className="min-h-[calc(100vh-220px)] rounded-t-none" // Adjust min-height and remove top rounding
            />
          </div>
        </div>
      </div>
       {isSupported && isListening && (
        <div 
            className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-3 rounded-full shadow-lg text-sm animate-pulse z-50"
            aria-live="assertive"
            aria-atomic="true"
        >
            Listening...
        </div>
      )}
    </div>
  );
};

export default ReportWorkspace;
