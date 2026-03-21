import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Mic } from 'lucide-react';

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

  useEffect(() => {
    if (realTimeTranslate && inputText.trim()) {
      onDebouncedTranslate(inputText);
    }
  }, [inputText, realTimeTranslate, onDebouncedTranslate]);

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
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      border: `1px solid ${isFocused ? '#0071e3' : '#e8e8ed'}`,
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      overflow: 'hidden',
      ...(isFocused ? { boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 0 0 3px rgba(0,113,227,0.1)' } : {}),
    }}>
      {/* Label */}
      <div style={{
        padding: '12px 16px 0',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <Mic size={13} color="#86868b" />
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#86868b',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          中文输入
        </span>
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
        placeholder={realTimeTranslate ? '输入中文，停顿后自动翻译播放...' : '输入中文，按 Enter 翻译播放...'}
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

      {/* Bottom toolbar */}
      <div style={{
        padding: '8px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #f0f0f5',
      }}>
        <span style={{ fontSize: 12, color: '#aeaeb2' }}>
          {isTranslating ? '翻译中...' : isSpeaking ? '播放中...' : ''}
        </span>
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
  );
}
