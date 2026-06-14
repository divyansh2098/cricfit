import { useState, useCallback } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export function useVoiceInput(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';

    if (text) {
      onResult(text);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('error', () => {
    setIsListening(false);
  });

  const startListening = useCallback(async () => {
    try {
      const { granted } =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!granted) {
        return;
      }

      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: false,
        continuous: false,
      });

      setIsListening(true);
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } finally {
      setIsListening(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    toggle,
  };
}