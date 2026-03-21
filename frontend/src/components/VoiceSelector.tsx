import React from 'react';
import { ArrowLeft, Play, Check } from 'lucide-react';
import type { Settings, AppView } from '../types';

const invoke = (window as any).__TAURI__?.core?.invoke;

const CLOUD_VOICES = [
  { id: 'Guy', label: 'Guy', desc: '成熟男声（en-US-GuyNeural）', gender: '男' },
  { id: 'Jenny', label: 'Jenny', desc: '自然女声（en-US-JennyNeural）', gender: '女' },
];

interface VoiceSelectorProps {
  settings: Settings;
  onUpdateSettings: (partial: Partial<Settings>) => void;
  onNavigate: (view: AppView) => void;
}

export default function VoiceSelector({ settings, onUpdateSettings, onNavigate }: VoiceSelectorProps) {
  const voices = CLOUD_VOICES; // TODO: Phase 3 - add Piper voices for local mode

  const handlePreview = async (voiceId: string) => {
    if (!invoke) return;
    try {
      await invoke('speak_text', {
        text: 'Hello, this is a voice preview for MeetSimul.',
        voice: voiceId,
        mode: settings.mode,
      });
    } catch (e) {
      console.error('Preview failed:', e);
    }
  };

  return (
    <div style={{ flex: 1, padding: '0 20px 20px', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0' }}>
        <button onClick={() => onNavigate('settings')} style={{
          width: 32, height: 32, border: 'none', borderRadius: 8,
          background: '#f5f5f7', color: '#86868b',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowLeft size={16} />
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f' }}>语音选择</h2>
      </div>

      <div style={{
        background: '#ffffff', borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8e8ed',
        overflow: 'hidden',
      }}>
        {voices.map((voice, i) => {
          const isSelected = settings.voice === voice.id;
          return (
            <div key={voice.id} style={{
              display: 'flex', alignItems: 'center', padding: '14px 16px',
              borderBottom: i < voices.length - 1 ? '1px solid #f0f0f5' : 'none',
              gap: 12,
              cursor: 'pointer',
              background: isSelected ? '#0071e305' : 'transparent',
              transition: 'background 0.2s',
            }}
              onClick={() => onUpdateSettings({ voice: voice.id })}
            >
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: isSelected ? '#0071e315' : '#f5f5f7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 600,
                color: isSelected ? '#0071e3' : '#86868b',
              }}>
                {voice.gender}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600,
                  color: isSelected ? '#0071e3' : '#1d1d1f',
                }}>
                  {voice.label}
                </div>
                <div style={{ fontSize: 12, color: '#86868b' }}>{voice.desc}</div>
              </div>

              {/* Preview */}
              <button
                onClick={(e) => { e.stopPropagation(); handlePreview(voice.id); }}
                style={{
                  width: 32, height: 32, border: 'none', borderRadius: 8,
                  background: '#f5f5f7', color: '#86868b', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <Play size={13} fill="#86868b" />
              </button>

              {/* Check */}
              {isSelected && <Check size={16} color="#0071e3" />}
            </div>
          );
        })}
      </div>

      {settings.mode === 'local' && (
        <div style={{
          marginTop: 16, padding: '14px 16px',
          background: '#fff8e6', borderRadius: 12,
          border: '1px solid #ffe0a0',
          fontSize: 12, color: '#86868b', lineHeight: 1.6,
        }}>
          本地模式下将使用 Piper TTS 语音引擎。下载模型后可使用更多本地音色。
        </div>
      )}
    </div>
  );
}
