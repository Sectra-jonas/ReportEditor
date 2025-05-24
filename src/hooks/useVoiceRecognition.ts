
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

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor | undefined;
    webkitSpeechRecognition: SpeechRecognitionConstructor | undefined;
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
      if (!recognitionRef.current) {
        recognitionRef.current = new (SpeechRecognitionAPI as any)();
      }
      
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

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
          if (event.error === 'aborted') {
            // "aborted" is a common event when recognition is stopped, especially by .abort()
            // or when the microphone permission is denied after starting.
            // We don't usually need to treat this as a user-facing error if it's just a stop.
            // The onend event will handle setting isListening to false.
            console.info('Speech recognition aborted (often normal during stop/cleanup or permission changes). Message:', event.message);
            // If isListening is true, it means onend hasn't fired yet or failed to.
            // This can happen if permission is revoked mid-recognition.
            if (isListening) {
              setIsListening(false);
            }
            // Optionally, still call onError if there's a specific message that indicates a problem
            // For example, if event.message indicates a permission issue not caught elsewhere.
            // onError?.(new Error(`Speech recognition aborted: ${event.message || event.error}`));
          } else {
            console.error('Speech recognition error:', event.error, event.message);
            // For other errors, call the onError prop and ensure listening state is false.
            // The `onend` event should also fire after an error, which also sets isListening to false.
            // However, to be safe, we can set it here too.
            if (isListening) { // Check to avoid unnecessary state update if already false
                setIsListening(false);
            }
            onError?.(event.error);
          }
        };
      }
    } else {
      setIsSupported(false);
      if (onError) {
        onError(new Error("Voice input not supported by the browser."));
      }
    }

    return () => {
      if (recognitionRef.current && isListening) { 
        recognitionRef.current.abort();
        // onend handler (which calls setIsListening(false)) should be triggered by abort.
        // If not, setIsListening(false) directly below might be needed, but could cause issues if onend *also* fires.
        // For now, rely on onend.
      }
    };
  }, [onResult, onEnd, onError, isListening]);


  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && isSupported) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
         console.error("Error starting voice recognition:", e);
         toast({ title: "Voice Error", description: "Could not start voice recognition.", variant: "destructive"});
         if (onError) onError(e);
      }
    } else if (!isSupported) {
        toast({ title: "Voice Input Not Supported", description: "Your browser does not support voice recognition.", variant: "destructive" });
        if (onError) onError(new Error("Voice input not supported by the browser."));
    }
  }, [isListening, isSupported, toast, onError]);

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

  useEffect(() => {
    if (typeof window !== 'undefined' && !isSupported && (window.SpeechRecognition || window.webkitSpeechRecognition) === undefined) {
        // This toast might be redundant if onError handles the "not supported" case.
        // toast({ title: "Voice Input Not Supported", description: "Your browser does not support voice recognition.", variant: "destructive" });
    }
  }, [isSupported, toast]);


  return { isListening, startListening, stopListening, toggleListening, isSupported };
};

export default useVoiceRecognition;

