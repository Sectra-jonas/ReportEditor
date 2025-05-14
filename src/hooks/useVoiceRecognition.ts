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
      recognitionRef.current = new (SpeechRecognitionAPI as any)();
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

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
          toast({ title: "Voice Error", description: `Speech recognition error: ${event.error}`, variant: "destructive" });
          setIsListening(false);
          onError?.(event.error);
        };
      }
    } else {
      setIsSupported(false);
      toast({ title: "Voice Input Not Supported", description: "Your browser does not support voice recognition.", variant: "destructive" });
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // onResult, onEnd, onError, toast are stable or state setters


  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
         console.error("Error starting voice recognition:", e);
         toast({ title: "Voice Error", description: "Could not start voice recognition.", variant: "destructive"});
      }
    }
  }, [isListening, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false); // onend will also set this, but good to be explicit
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return { isListening, startListening, stopListening, toggleListening, isSupported };
};

export default useVoiceRecognition;
