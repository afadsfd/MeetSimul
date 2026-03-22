import { useState, useRef, useCallback, useEffect } from 'react';
import { isSystemPrompt } from '../utils/systemPromptFilter';
import type { Settings, TranslateResult, HistoryItem } from '../types';

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

let historyIdCounter = 0;

export function useTranslation(settings: Settings) {
  const [translation, setTranslation] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const lastSpokenRef = useRef('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen to Rust speak_status events for accurate isSpeaking state
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
      } catch {}
    };
    setup();
    return () => { unlisten?.(); };
  }, []);

  // Translate and speak — used for final results
  const translateAndSpeak = useCallback(async (text: string) => {
    if (!text.trim() || isSystemPrompt(text) || !invoke) return;

    setIsTranslating(true);
    try {
      const result = await invoke<TranslateResult>('translate_text', {
        text: text.trim(),
        mode: settings.mode,
        isFinal: true,
      });
      setTranslation(result.translated);

      // Add to history
      if (result.translated) {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        setHistory(prev => [...prev, {
          id: ++historyIdCounter,
          time: timeStr,
          zh: text.trim(),
          en: result.translated,
        }]);

        lastSpokenRef.current = result.translated;
        try {
          await invoke('speak_text', {
            text: result.translated,
            voice: settings.voice,
            mode: settings.mode,
            speed: settings.tts_speed,
          });
        } catch (e) {
          console.error('TTS error:', e);
        }
      }
    } catch (e) {
      console.error('Translation error:', e);
    }
    setIsTranslating(false);
  }, [settings.mode, settings.voice, settings.tts_speed]);

  // Translate only (no TTS) — for real-time preview
  const translateOnly = useCallback(async (text: string) => {
    if (!text.trim() || isSystemPrompt(text) || !invoke) return;
    setIsTranslating(true);
    try {
      const result = await invoke<TranslateResult>('translate_text', {
        text: text.trim(),
        mode: settings.mode,
        isFinal: false,
      });
      setTranslation(result.translated);
    } catch (e) {
      console.error('Translation error:', e);
    }
    setIsTranslating(false);
  }, [settings.mode]);

  // Debounced translate — only translates, no TTS
  const debouncedTranslateOnly = useCallback((text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      translateOnly(text);
    }, 300);
  }, [translateOnly]);

  const stopSpeaking = useCallback(async () => {
    if (invoke) {
      try { await invoke('stop_speaking'); } catch {}
    }
    setIsSpeaking(false);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    translation,
    isSpeaking,
    isTranslating,
    history,
    translateAndSpeak,
    translateOnly,
    debouncedTranslateOnly,
    stopSpeaking,
    setTranslation,
    clearHistory,
  };
}
