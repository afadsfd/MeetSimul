import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Mic, MicOff } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface InputPanelProps {
  onTranslateAndSpeak: (text: string) => void;
  onDebouncedTranslate: (text: string) => void;
  onStopSpeaking: () => void;
  isSpeaking: boolean;
  isTranslating: boolean;
  realTimeTranslate: boolean;
}

export default function InputPanel({
  onTranslateAndSpeak,
  onDebouncedTranslate,
  onStopSpeaking,
  isSpeaking,
  isTranslating,
  realTimeTranslate,
}: InputPanelProps) {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const inputTextRef = useRef(inputText);

  // Keep ref in sync
  useEffect(() => {
    inputTextRef.current = inputText;
  }, [inputText]);

  // Listen for speech recognition events from Rust backend
  useEffect(() => {
    let unlistenResult: (() => void) | null = null;
    let unlistenStatus: (() => void) | null = null;
    let unlistenError: (() => void) | null = null;

    const setup = async () => {
      try {
        unlistenResult = await listen<{ text: string; final: boolean | string }>('speech_recognized', (event) => {
          const { text } = event.payload;
          const isFinal = Boolean(event.payload.final) || event.payload.final === 'true';
          if (text) {
            if (isFinal) {
              // Final result: translate+speak, then clear input for next sentence
              onTranslateAndSpeak(text);
              setInputText('');
            } else {
              // Interim result: show in input box
              setInputText(text);
            }
          }
        });

        unlistenStatus = await listen<{ status: string }>('speech_status', (event) => {
          if (event.payload.status === 'listening') {
            setIsListening(true);
            setSpeechError('');
          }
        });

        unlistenError = await listen<{ error: string }>('speech_error', (event) => {
          setSpeechError(event.payload.error);
          setIsListening(false);
        });
      } catch {
        // Not in Tauri environment
      }
    };

    setup();

    return () => {
      unlistenResult?.();
      unlistenStatus?.();
      unlistenError?.();
    };
  }, [realTimeTranslate, onDebouncedTranslate, onTranslateAndSpeak]);

  const toggleListening = useCallback(async () => {
    if (isListening) {
      // Stop listening
      try {
        await invoke('stop_listening');
      } catch {}
      setIsListening(false);
      // Auto-translate when stopping
      const currentText = inputTextRef.current;
      if (currentText.trim() && !realTimeTranslate) {
        onTranslateAndSpeak(currentText);
        setInputText('');
      }
    } else {
      // Start listening
      setSpeechError('');
      try {
        await invoke('start_listening');
        setIsListening(true);
      } catch (e) {
        setSpeechError(String(e));
      }
    }
  }, [isListening, realTimeTranslate, onTranslateAndSpeak]);

  useEffect(() => {
    // 实时翻译预览（仅翻译不播放）
    // 键盘输入：边说边译开启时触发
    // 语音输入：始终触发，预填缓存，final 时直接命中缓存省掉翻译延迟
    if (inputText.trim() && (realTimeTranslate || isListening)) {
      onDebouncedTranslate(inputText);
    }
  }, [inputText, realTimeTranslate, onDebouncedTranslate, isListening]);

  const handlePlay = () => {
    if (!inputText.trim()) return;
    if (isSpeaking) {
      onStopSpeaking();
      return;
    }
    onTranslateAndSpeak(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !realTimeTranslate) {
      e.preventDefault();
      handlePlay();
    }
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 14,
      boxShadow: isListening
        ? '0 2px 12px rgba(0,0,0,0.06), 0 0 0 3px rgba(52,199,89,0.2)'
        : isFocused
          ? '0 2px 12px rgba(0,0,0,0.06), 0 0 0 3px rgba(0,113,227,0.1)'
          : '0 2px 12px rgba(0,0,0,0.06)',
      border: `1px solid ${isListening ? '#34c759' : isFocused ? '#0071e3' : '#e8e8ed'}`,
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      overflow: 'hidden',
    }}>
      {/* Label */}
      <div style={{
        padding: '12px 16px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Mic size={13} color={isListening ? '#34c759' : '#86868b'} />
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: isListening ? '#34c759' : '#86868b',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            {isListening ? '正在听写...' : '中文输入'}
          </span>
          {isListening && (
            <span style={{
              display: 'inline-flex',
              gap: 2,
              alignItems: 'center',
              marginLeft: 4,
            }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 3,
                  height: 10,
                  background: '#34c759',
                  borderRadius: 2,
                  animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
                }} />
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        autoFocus
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={isListening ? '请开始说话...' : realTimeTranslate ? '输入中文，停顿后自动翻译播放...' : '输入中文，按 Enter 翻译播放...'}
        style={{
          width: '100%',
          height: 100,
          padding: '8px 16px',
          background: 'transparent',
          border: 'none',
          fontSize: 15,
          color: '#1d1d1f',
          resize: 'none',
          outline: 'none',
          fontFamily: 'inherit',
          lineHeight: 1.6,
        }}
      />

      {/* Error message */}
      {speechError && (
        <div style={{
          padding: '4px 16px',
          fontSize: 12,
          color: '#ff3b30',
        }}>
          {speechError}
        </div>
      )}

      {/* Bottom toolbar */}
      <div style={{
        padding: '8px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #f0f0f5',
      }}>
        <span style={{ fontSize: 12, color: '#aeaeb2' }}>
          {isListening ? '语音识别中...' : isTranslating ? '翻译中...' : isSpeaking ? '播放中...' : ''}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Mic button */}
          <button
            onClick={toggleListening}
            title={isListening ? '停止听写' : '开始听写'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              background: isListening ? '#ff3b30' : '#f5f5f7',
              color: isListening ? '#ffffff' : '#1d1d1f',
              transition: 'all 0.2s ease',
            }}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* Play/Stop button */}
          <button
            onClick={handlePlay}
            disabled={!inputText.trim() && !isSpeaking}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 16px',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: inputText.trim() || isSpeaking ? 'pointer' : 'default',
              background: isSpeaking ? '#ff3b30' : inputText.trim() ? '#0071e3' : '#e8e8ed',
              color: (inputText.trim() || isSpeaking) ? '#ffffff' : '#aeaeb2',
              transition: 'all 0.2s ease',
            }}
          >
            {isSpeaking ? (
              <>
                <Square size={12} fill="currentColor" />
                停止
              </>
            ) : (
              <>
                <Play size={12} fill="currentColor" />
                播放
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
