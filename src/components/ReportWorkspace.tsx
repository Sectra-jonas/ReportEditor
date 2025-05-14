
"use client";

import RichTextEditor from '@/components/editor/RichTextEditor';
import EditorToolbar from '@/components/editor/EditorToolbar';
import { MainToolbar } from '@/components/layout/MainToolbar';
import { useReport } from '@/contexts/ReportContext';
import useVoiceRecognition from '@/hooks/useVoiceRecognition';
import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const ReportWorkspace = () => {
  const { editor, setEditor, currentReport, isDirty, setIsDirty, createNewReport } = useReport();
  const { toast } = useToast();
  const lastInsertedTextRef = useRef<string | null>(null);

  const handleVoiceResult = useCallback((transcript: string, isFinal: boolean) => {
    if (editor && editor.isEditable) {
      if (isFinal) {
        const { from, to } = editor.state.selection;
        editor.chain().focus().insertContentAt({ from, to }, transcript + " ").run();
        lastInsertedTextRef.current = null;
        if (!isDirty) {
          setIsDirty(true);
        }
      } else {
        // Interim results handled by visual indicator
      }
    }
  }, [editor, isDirty, setIsDirty]);

  const handleVoiceEnd = useCallback(() => {
    // Handled by isListening state change in the hook
  }, []);

  const handleVoiceError = useCallback((error: any) => {
    toast({ title: "Voice Recognition Error", description: error.message || String(error), variant: "destructive" });
  }, [toast]);

  const { isListening, toggleListening, isSupported } = useVoiceRecognition({
    onResult: handleVoiceResult,
    onEnd: handleVoiceEnd,
    onError: handleVoiceError,
  });

  useEffect(() => {
    if (!currentReport && editor) {
       createNewReport();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]); // Depend on editor initialization, createNewReport is memoized

  const handleEditorUpdate = () => {
    if (editor && editor.isEditable) {
        if (!isDirty) setIsDirty(true);
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
            disableControls={!currentReport}
          />
          <div className="flex-grow h-full overflow-y-auto">
            <RichTextEditor
              key={currentReport ? currentReport.id : 'no-report'} // Key change to force remount
              content={currentReport?.content || ''}
              setEditorInstance={setEditor}
              onUpdate={handleEditorUpdate}
              editable={!!currentReport}
              placeholder="Start your radiology report here... Use [FieldName] or [OptionA|OptionB] for template fields."
              className="min-h-[calc(100vh-220px)] rounded-t-none"
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
