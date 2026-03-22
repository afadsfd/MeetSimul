import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Check, Volume2, RefreshCw } from 'lucide-react';
import type { Settings, AppView, SystemVoice } from '../types';

import { invoke } from '@tauri-apps/api/core';

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
  const [systemVoices, setSystemVoices] = useState<SystemVoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  // Load system voices on mount
  useEffect(() => {
    loadSystemVoices();
  }, []);

  const loadSystemVoices = async () => {
    setLoading(true);
    try {
      const voices = await invoke<SystemVoice[]>('get_system_voices');
      setSystemVoices(voices);
    } catch (e) {
      console.error('Failed to load system voices:', e);
    }
    setLoading(false);
  };

  const handlePreview = async (voiceId: string, mode: 'cloud' | 'local') => {
    setPreviewingVoice(voiceId);
    try {
      await invoke('speak_text', {
        text: 'Hello, this is a voice preview for MeetSimul.',
        voice: voiceId,
        mode,
      });
    } catch (e) {
      console.error('Preview failed:', e);
    }
    setTimeout(() => setPreviewingVoice(null), 2000);
  };

  const selectedLocalVoice = settings.local_voice || '';

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

      {/* Cloud Voices Section */}
      <SectionTitle title="云端语音（Edge TTS）" subtitle="高品质神经网络语音，需要网络" />
      <div style={{
        background: '#ffffff', borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8e8ed',
        overflow: 'hidden', marginBottom: 24,
      }}>
        {CLOUD_VOICES.map((voice, i) => {
          const isSelected = settings.voice === voice.id;
          return (
            <VoiceRow
              key={voice.id}
              name={voice.label}
              desc={voice.desc}
              avatar={voice.gender}
              isSelected={isSelected}
              isPreviewing={previewingVoice === voice.id}
              isLast={i === CLOUD_VOICES.length - 1}
              onSelect={() => onUpdateSettings({ voice: voice.id })}
              onPreview={() => handlePreview(voice.id, 'cloud')}
            />
          );
        })}
      </div>

      {/* Local Voices Section */}
      <SectionTitle
        title="本地语音（macOS 系统）"
        subtitle="零延迟，本地模式下使用"
        action={
          <button onClick={loadSystemVoices} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: '#0071e3', display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 500, padding: '2px 6px', borderRadius: 6,
          }}>
            <RefreshCw size={12} className={loading ? 'spinning' : ''} />
            刷新
          </button>
        }
      />

      {loading ? (
        <div style={{
          padding: 40, textAlign: 'center', color: '#86868b', fontSize: 13,
        }}>
          正在获取系统语音...
        </div>
      ) : systemVoices.length === 0 ? (
        <div style={{
          padding: '20px 16px', background: '#fff8e6', borderRadius: 12,
          border: '1px solid #ffe0a0', fontSize: 13, color: '#86868b', lineHeight: 1.6,
        }}>
          未找到英文语音。请在「系统设置 → 辅助功能 → 朗读内容 → 系统语音」中下载英文语音包。
        </div>
      ) : (
        <div style={{
          background: '#ffffff', borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8e8ed',
          overflow: 'hidden',
        }}>
          {systemVoices.map((voice, i) => {
            const isSelected = selectedLocalVoice === voice.name;
            const isPremium = voice.name.includes('(') ||
              ['Zoe', 'Evan', 'Shelley', 'Reed', 'Sandy', 'Rocko'].some(n => voice.name.startsWith(n));
            return (
              <VoiceRow
                key={voice.name}
                name={voice.name}
                desc={`${voice.lang}${isPremium ? ' · 高级语音' : ''}`}
                avatar={isPremium ? '★' : '♪'}
                isSelected={isSelected}
                isPreviewing={previewingVoice === voice.name}
                isLast={i === systemVoices.length - 1}
                isPremium={isPremium}
                onSelect={() => onUpdateSettings({ local_voice: voice.name })}
                onPreview={() => handlePreview(voice.name, 'local')}
              />
            );
          })}
        </div>
      )}

      {/* Tip */}
      <div style={{
        marginTop: 16, padding: '14px 16px',
        background: '#f0f7ff', borderRadius: 12,
        border: '1px solid #d0e4ff',
        fontSize: 12, color: '#0071e3', lineHeight: 1.6,
      }}>
        💡 建议下载带 ★ 标记的高级语音（Premium），音质更接近自然人声。前往「系统设置 → 辅助功能 → 朗读内容 → 系统语音 → 管理语音」下载更多语音。
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <div>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f', marginBottom: 2 }}>{title}</h3>
        <p style={{ fontSize: 11, color: '#86868b' }}>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function VoiceRow({ name, desc, avatar, isSelected, isPreviewing, isLast, isPremium, onSelect, onPreview }: {
  name: string;
  desc: string;
  avatar: string;
  isSelected: boolean;
  isPreviewing: boolean;
  isLast: boolean;
  isPremium?: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '12px 16px',
      borderBottom: isLast ? 'none' : '1px solid #f0f0f5',
      gap: 12, cursor: 'pointer',
      background: isSelected ? '#0071e305' : 'transparent',
      transition: 'background 0.2s',
    }}
      onClick={onSelect}
    >
      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: isSelected ? '#0071e315' : isPremium ? '#fff3e0' : '#f5f5f7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 600,
        color: isSelected ? '#0071e3' : isPremium ? '#ff9500' : '#86868b',
        flexShrink: 0,
      }}>
        {avatar}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600,
          color: isSelected ? '#0071e3' : '#1d1d1f',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name}
        </div>
        <div style={{ fontSize: 11, color: '#86868b' }}>{desc}</div>
      </div>

      {/* Preview */}
      <button
        onClick={(e) => { e.stopPropagation(); onPreview(); }}
        style={{
          width: 30, height: 30, border: 'none', borderRadius: 8,
          background: isPreviewing ? '#0071e3' : '#f5f5f7',
          color: isPreviewing ? '#ffffff' : '#86868b',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', flexShrink: 0,
        }}
      >
        {isPreviewing ? <Volume2 size={13} /> : <Play size={13} fill="#86868b" />}
      </button>

      {/* Check */}
      {isSelected && <Check size={16} color="#0071e3" style={{ flexShrink: 0 }} />}
    </div>
  );
}
