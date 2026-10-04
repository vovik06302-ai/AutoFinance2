import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

export interface SpeechRecognitionOptions {
  onStart?: () => void;
  onResult?: (transcript: string) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
}

export async function startHybridSpeechRecognition(options: SpeechRecognitionOptions) {
  if (Capacitor.isNativePlatform()) {
    try {
      // 1. Check & Request Permissions for Microphone / Speech Recognition on Native Android
      const permissionStatus = await SpeechRecognition.checkPermissions();
      if (permissionStatus.speechRecognition !== 'granted') {
        const req = await SpeechRecognition.requestPermissions();
        if (req.speechRecognition !== 'granted') {
          options.onError?.('Разрешение на использование микрофона не предоставлено.');
          return;
        }
      }

      // 2. Check availability
      const available = await SpeechRecognition.available();
      if (!available.available) {
        options.onError?.('Голосовое распознавание недоступно на этом устройстве.');
        return;
      }

      options.onStart?.();

      // Listen for partial / final results
      const resultListener = await SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
        if (data.matches && data.matches.length > 0) {
          options.onResult?.(data.matches[0]);
        }
      });

      // Start recognition
      await SpeechRecognition.start({
        language: 'ru-RU',
        maxResults: 1,
        prompt: 'Произнесите финансовую команду...',
        partialResults: true,
        popup: true
      });

      // Note: On native, after start or when user finishes speaking, stop & remove listener
    } catch (err) {
      console.error('Capacitor Speech Recognition error', err);
      options.onError?.(err);
      options.onEnd?.();
    }
  } else {
    // Web Browser Speech API Fallback
    const SpeechRecognitionWeb = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionWeb) {
      options.onError?.('Web Speech API не поддерживается в этом браузере.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionWeb();
      recognition.lang = 'ru-RU';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        options.onStart?.();
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        options.onResult?.(transcript);
      };

      recognition.onerror = (err: any) => {
        options.onError?.(err);
      };

      recognition.onend = () => {
        options.onEnd?.();
      };

      recognition.start();
    } catch (e) {
      options.onError?.(e);
      options.onEnd?.();
    }
  }
}

export async function stopHybridSpeechRecognition() {
  if (Capacitor.isNativePlatform()) {
    try {
      await SpeechRecognition.stop();
      await SpeechRecognition.removeAllListeners();
    } catch (e) {}
  }
}
