import { useState, useRef, useCallback } from 'react';
import { isSystemPrompt } from '../utils/systemPromptFilter';
import type { Settings } from '../types';

const invoke = (window as any).__TAURI__?.core?.invoke;

export function useTranslation(settings: Settings) {
  const [translation, setTranslation] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const lastSpokenRef = useRef('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const translateAndSpeak = useCallback(async (text: string, speakAfter = true) => {
    if (!text.trim() || isSystemPrompt(text) || !invoke) return;

    setIsTranslating(true);
    try {
      const result = await invoke('translate_text', {
        text: text.trim(),
        mode: settings.mode,
      });
      setTranslation(result.translated);

      if (speakAfter && result.translated !== lastSpokenRef.current) {
        lastSpokenRef.current = result.translated;
        setIsSpeaking(true);
        try {
          await invoke('speak_text', {
            text: result.translated,
            voice: settings.voice,
            mode: settings.mode,
          });
        } catch (e) {
          console.error('TTS error:', e);
        }
        setIsSpeaking(false);
      }
    } catch (e) {
      console.error('Translation error:', e);
    }
    setIsTranslating(false);
  }, [settings.mode, settings.voice]);

  const translateOnly = useCallback(async (text: string) => {
    if (!text.trim() || isSystemPrompt(text) || !invoke) return;
    setIsTranslating(true);
    try {
      const result = await invoke('translate_text', {
        text: text.trim(),
        mode: settings.mode,
      });
      setTranslation(result.translated);
    } catch (e) {
      console.error('Translation error:', e);
    }
    setIsTranslating(false);
  }, [settings.mode]);

  const debouncedTranslateAndSpeak = useCallback((text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      translateAndSpeak(text, true);
    }, 300);
  }, [translateAndSpeak]);

  const stopSpeaking = useCallback(async () => {
    if (invoke) {
      try {
        await invoke('stop_speaking');
      } catch {}
    }
    setIsSpeaking(false);
  }, []);

  return {
    translation,
    isSpeaking,
    isTranslating,
    translateAndSpeak,
    translateOnly,
    debouncedTranslateAndSpeak,
    stopSpeaking,
    setTranslation,
  };
}
