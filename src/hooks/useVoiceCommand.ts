import { useState, useCallback, useEffect } from 'react';

export function useVoiceCommand(onCommand: (command: string) => void) {
  const [isActive, setIsActive] = useState(false);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'it-IT';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => setIsActive(true);
    recognition.onend = () => setIsActive(false);

    recognition.onresult = (event: any) => {
      const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      onCommand(command);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Speech recognition already started or error", e);
    }

    return recognition;
  }, [onCommand]);

  return { isActive, startListening };
}
