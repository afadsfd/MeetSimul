import { useState, useRef, useCallback, useEffect } from 'react';
import { isSystemPrompt } from '../utils/systemPromptFilter';
import type { Settings, TranslateResult } from '../types';

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export function useTranslation(settings: Settings) {
  const [translation, setTranslation] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const lastSpokenRef = useRef('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fix #3: Listen to Rust speak_status events for accurate isSpeaking state
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setup = async () => {
      try {
        unlisten = await listen<{ status: string }>('speak_status', (event) => {
          if (event.payload.status === 'playing') {
            setIsSpeaking(true);
          } else if (event.payload.status === 'idle') {
            setIsSpeaking(false);
          }
        });
      } catch {
        // Not in Tauri environment
      }
    };

    setup();
    return () => { unlisten?.(); };
  }, []);

  // Translate and speak — used for final results (Enter key, mic final, play button)
  const translateAndSpeak = useCallback(async (text: string) => {
    if (!text.trim() || isSystemPrompt(text) || !invoke) return;

    setIsTranslating(true);
    try {
      const result = await invoke<TranslateResult>('translate_text', {
        text: text.trim(),
        mode: settings.mode,
      });
      setTranslation(result.translated);

      if (result.translated) {
        lastSpokenRef.current = result.translated;
        try {
          await invoke('speak_text', {
            text: result.translated,
            voice: settings.voice,
            mode: settings.mode,
          });
        } catch (e) {
          console.error('TTS error:', e);
        }
      }
    } catch (e) {
      console.error('Translation error:', e);
    }
    setIsTranslating(false);
  }, [settings.mode, settings.voice]);

  // Fix #2: Translate only (no TTS) — used for real-time/debounced preview
  const translateOnly = useCallback(async (text: string) => {
    if (!text.trim() || isSystemPrompt(text) || !invoke) return;
    setIsTranslating(true);
    try {
      const result = await invoke<TranslateResult>('translate_text', {
        text: text.trim(),
        mode: settings.mode,
      });
      setTranslation(result.translated);
    } catch (e) {
      console.error('Translation error:', e);
    }
    setIsTranslating(false);
  }, [settings.mode]);

  // Fix #2: Debounced translate — only translates, no TTS
  const debouncedTranslateOnly = useCallback((text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      translateOnly(text);
    }, 300);
  }, [translateOnly]);

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
    debouncedTranslateOnly,
    stopSpeaking,
    setTranslation,
  };
}
