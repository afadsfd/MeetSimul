import React from 'react';
import { Settings as SettingsIcon, ChevronDown } from 'lucide-react';
import type { Settings } from '../types';

interface HeaderProps {
  settings: Settings;
  onUpdateSettings: (partial: Partial<Settings>) => void;
  onOpenSettings: () => void;
  isSpeaking: boolean;
}

const VOICES = [
  { id: 'Guy', label: '男声' },
  { id: 'Jenny', label: '女声' },
];

export default function Header({ settings, onUpdateSettings, onOpenSettings, isSpeaking }: HeaderProps) {
  const modeLabel = settings.mode === 'local' ? '本地模式' : '云端模式';
  const modeColor = settings.mode === 'local' ? '#34c759' : '#0071e3';

  return (
    <header
      style={{
        // @ts-ignore
        WebkitAppRegion: 'drag',
        padding: '16px 20px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e8e8ed',
        background: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Left: Title + Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '-0.2px',
          color: '#1d1d1f',
        }}>
          MeetSimul
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '2px 10px',
          borderRadius: 100,
          background: `${modeColor}10`,
          border: `1px solid ${modeColor}30`,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: modeColor,
          }} />
          <span style={{ fontSize: 11, color: modeColor, fontWeight: 600 }}>
            {modeLabel}
          </span>
        </div>
        {isSpeaking && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 100,
            background: '#ff950010', border: '1px solid #ff950030',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#ff9500',
              animation: 'pulse 1s infinite',
            }} />
            <span style={{ fontSize: 11, color: '#ff9500', fontWeight: 500 }}>
              播放中
            </span>
          </div>
        )}
      </div>

      {/* Right: Controls */}
      {/* @ts-ignore */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, WebkitAppRegion: 'no-drag' }}>
        {/* Voice Selector */}
        <div style={{
          display: 'flex',
          background: '#f5f5f7',
          borderRadius: 8,
          padding: 2,
        }}>
          {VOICES.map(v => (
            <button key={v.id} onClick={() => onUpdateSettings({ voice: v.id })} style={{
              padding: '4px 14px',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: settings.voice === v.id ? '#ffffff' : 'transparent',
              color: settings.voice === v.id ? '#1d1d1f' : '#86868b',
              boxShadow: settings.voice === v.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>
              {v.label}
            </button>
          ))}
        </div>

        {/* Real-time Toggle */}
        <button
          onClick={() => onUpdateSettings({ real_time_translate: !settings.real_time_translate })}
          style={{
            padding: '4px 12px',
            border: 'none',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: settings.real_time_translate ? '#0071e3' : '#f5f5f7',
            color: settings.real_time_translate ? '#ffffff' : '#86868b',
          }}
        >
          边说边译
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          style={{
            width: 32, height: 32,
            border: 'none',
            borderRadius: 8,
            background: '#f5f5f7',
            color: '#86868b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#e8e8ed';
            e.currentTarget.style.color = '#1d1d1f';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#f5f5f7';
            e.currentTarget.style.color = '#86868b';
          }}
        >
          <SettingsIcon size={16} />
        </button>
      </div>
    </header>
  );
}
