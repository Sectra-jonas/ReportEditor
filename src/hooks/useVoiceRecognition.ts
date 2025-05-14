
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  grammars: any; // SpeechGrammarList
  onaudiostart: (() => void) | null;
  onaudioend: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null; // SpeechRecognitionErrorEvent
  onnomatch: (() => void) | null;
  onresult: ((event: any) => void) | null; // SpeechRecognitionEvent
  onsoundstart: (() => void) | null;
  onsoundend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition | undefined;
    webkitSpeechRecognition: typeof SpeechRecognition | undefined;
  }
}

interface UseVoiceRecognitionProps {
  onResult: (transcript: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

const useVoiceRecognition = ({ onResult, onEnd, onError }: UseVoiceRecognitionProps) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setIsSupported(true);
      // Initialize recognitionRef only once or if it's null
      if (!recognitionRef.current) {
        recognitionRef.current = new (SpeechRecognitionAPI as any)();
      }
      
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        // Detach previous handlers before attaching new ones to prevent multiple listeners
        recognition.onresult = null;
        recognition.onend = null;
        recognition.onerror = null;

        recognition.onresult = (event: any /* SpeechRecognitionEvent */) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) onResult(finalTranscript, true);
          if (interimTranscript) onResult(interimTranscript, false);
        };

        recognition.onend = () => {
          setIsListening(false);
          onEnd?.();
        };

        recognition.onerror = (event: any /* SpeechRecognitionErrorEvent */) => {
          console.error('Speech recognition error', event.error);
          // toast({ title: "Voice Error", description: `Speech recognition error: ${event.error}`, variant: "destructive" });
          // The onError callback prop will be called, which in ReportWorkspace already shows a toast.
          setIsListening(false);
          onError?.(event.error);
        };
      }
    } else {
      setIsSupported(false);
      // Avoid toast during initial render or if already handled by parent
      // toast({ title: "Voice Input Not Supported", description: "Your browser does not support voice recognition.", variant: "destructive" });
      if (onError) {
        onError(new Error("Voice input not supported by the browser."));
      }
    }

    // Cleanup function: Stop recognition if it's active when the component unmounts or dependencies change significantly
    return () => {
      if (recognitionRef.current && isListening) { // Only abort if it was actually listening
        recognitionRef.current.abort();
        setIsListening(false);
      }
    };
  }, [onResult, onEnd, onError, isListening]); // Added isListening to dependencies to manage abort correctly


  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
         console.error("Error starting voice recognition:", e);
         toast({ title: "Voice Error", description: "Could not start voice recognition.", variant: "destructive"});
         if (onError) onError(e);
      }
    }
  }, [isListening, toast, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      // onend will set isListening to false
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Effect to show toast once if not supported
  useEffect(() => {
    if (typeof window !== 'undefined' && !isSupported && (window.SpeechRecognition || window.webkitSpeechRecognition) === undefined) {
        // Ensure this toast appears only once after checking support
        toast({ title: "Voice Input Not Supported", description: "Your browser does not support voice recognition.", variant: "destructive" });
    }
  }, [isSupported, toast]);


  return { isListening, startListening, stopListening, toggleListening, isSupported };
};

export default useVoiceRecognition;
