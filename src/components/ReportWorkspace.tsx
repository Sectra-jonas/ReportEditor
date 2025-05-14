"use client";

import RichTextEditor from '@/components/editor/RichTextEditor';
import EditorToolbar from '@/components/editor/EditorToolbar';
import { MainToolbar } from '@/components/layout/MainToolbar';
import { useReport } from '@/contexts/ReportContext';
import useVoiceRecognition from '@/hooks/useVoiceRecognition';
import { useEffect, useRef }
from 'react';
import { useToast } from '@/hooks/use-toast';

const ReportWorkspace = () => {
  const { editor, setEditor, currentReport, isDirty, setIsDirty } = useReport();
  const { toast } = useToast();
  const lastInsertedTextRef = useRef<string | null>(null);

  const handleVoiceResult = (transcript: string, isFinal: boolean) => {
    if (editor) {
      if (isFinal) {
        // Append final transcript
        const currentPos = editor.state.selection.to;
        editor.chain().focus().insertContentAt(currentPos, transcript + " ").run();
        lastInsertedTextRef.current = null; // Clear ref after final insertion
      } else {
        // Replace interim transcript: find last inserted interim and replace or append
        // This is a simplified approach. A more robust way would be to mark the interim text.
        const currentPos = editor.state.selection.to;
        if (lastInsertedTextRef.current) {
           // Attempt to find and replace the previous interim transcript
           // This is tricky and might not be perfectly accurate without specific markers
           // For simplicity, let's just insert and the user can manually correct or wait for final.
           // A more advanced solution would be to use a transaction to replace a specific range.
        }
        // For now, just let it append and user can see it update. Or, insert at caret.
        // editor.chain().focus().insertContentAt(editor.state.selection.to, transcript).run();
        // A better interim UX is to show it elsewhere or use specific editor commands if available.
        // For now, this might cause text jumping. Let's focus on final results.
        // Simpler: just append if it's clearly different from last interim
        if(transcript !== lastInsertedTextRef.current){
            // console.log("Interim: ", transcript);
        }
        // No action for interim to avoid text jumping, only on final.
      }
    }
  };
  
  const handleVoiceEnd = () => {
    // Voice recognition ended
  };

  const handleVoiceError = (error: any) => {
    toast({ title: "Voice Recognition Error", description: error.message || String(error), variant: "destructive" });
  };

  const { isListening, toggleListening, isSupported } = useVoiceRecognition({
    onResult: handleVoiceResult,
    onEnd: handleVoiceEnd,
    onError: handleVoiceError,
  });

  // Initialize with a new blank report if none exists
  useEffect(() => {
    if (!currentReport && editor) {
       // This is handled by ReportProvider: createNewReport() can be called initially if needed.
       // Or, page.tsx can trigger initial report creation.
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditorUpdate = () => {
    if (!isDirty) setIsDirty(true);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <MainToolbar />
      <div className="flex flex-col flex-grow p-4 overflow-hidden">
        <div className="flex flex-col flex-grow border border-input rounded-md shadow-lg bg-card">
          <EditorToolbar 
            editor={editor} 
            isVoiceActive={isListening} 
            onToggleVoice={isSupported ? toggleListening : undefined} 
          />
          <div className="flex-grow h-full overflow-y-auto">
            <RichTextEditor
              content={currentReport?.content || ''}
              setEditorInstance={setEditor}
              onUpdate={handleEditorUpdate}
              placeholder="Start your radiology report here... Use the toolbar for formatting or voice input."
              className="min-h-[calc(100vh-200px)]" // Adjust min-height as needed
            />
          </div>
        </div>
      </div>
       {/* Voice status indicator example (can be integrated into toolbar) */}
       {isSupported && isListening && (
        <div 
            className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-3 rounded-full shadow-lg text-sm animate-pulse"
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
