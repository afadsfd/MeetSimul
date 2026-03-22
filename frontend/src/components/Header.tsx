import React from 'react';
import { Settings as SettingsIcon, BookOpen, Cloud, Cpu } from 'lucide-react';
import type { Settings, AppView } from '../types';

interface HeaderProps {
  settings: Settings;
  onUpdateSettings: (partial: Partial<Settings>) => void;
  onOpenSettings: () => void;
  onNavigate: (view: AppView) => void;
  isSpeaking: boolean;
}

const VOICES = [
  { id: 'Guy', label: '男声' },
  { id: 'Jenny', label: '女声' },
];

export default function Header({ settings, onUpdateSettings, onOpenSettings, onNavigate, isSpeaking }: HeaderProps) {
  return (
    <header
      style={{
        // @ts-ignore
        WebkitAppRegion: 'drag',
        borderBottom: '1px solid #e8e8ed',
        background: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Top row: Title + Speaking status */}
      <div style={{
        padding: '14px 20px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '-0.2px',
            color: '#1d1d1f',
          }}>
            会议同传
          </h1>
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

        {/* Settings gear */}
        {/* @ts-ignore */}
        <button
          onClick={onOpenSettings}
          style={{
            // @ts-ignore
            WebkitAppRegion: 'no-drag',
            width: 30, height: 30,
            border: 'none',
            borderRadius: 8,
            background: 'transparent',
            color: '#aeaeb2',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#f5f5f7';
            e.currentTarget.style.color = '#1d1d1f';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#aeaeb2';
          }}
        >
          <SettingsIcon size={15} />
        </button>
      </div>

      {/* Control bar */}
      {/* @ts-ignore */}
      <div style={{
        // @ts-ignore
        WebkitAppRegion: 'no-drag',
        padding: '10px 20px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
      }}>
        {/* Mode Toggle: 云端 / 本地 */}
        <SegmentedControl
          options={[
            { id: 'cloud', label: '云端', icon: <Cloud size={12} /> },
            { id: 'local', label: '本地', icon: <Cpu size={12} /> },
          ]}
          value={settings.mode}
          onChange={(v) => onUpdateSettings({ mode: v as 'local' | 'cloud' })}
        />

        <Divider />

        {/* Voice Toggle: 男声 / 女声 */}
        <SegmentedControl
          options={VOICES.map(v => ({ id: v.id, label: v.label }))}
          value={settings.voice}
          onChange={(v) => onUpdateSettings({ voice: v })}
        />

        <Divider />

        {/* 边说边译 Toggle */}
        <PillButton
          active={settings.real_time_translate}
          onClick={() => onUpdateSettings({ real_time_translate: !settings.real_time_translate })}
          label="边说边译"
        />

        <Divider />

        {/* Glossary Button */}
        <PillButton
          active={false}
          onClick={() => onNavigate('glossary')}
          label="词库"
          icon={<BookOpen size={12} />}
        />
      </div>
    </header>
  );
}

/* ─── Reusable sub-components ─── */

function SegmentedControl({ options, value, onChange }: {
  options: { id: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      background: '#f5f5f7',
      borderRadius: 8,
      padding: 2,
    }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          padding: '4px 12px',
          border: 'none',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          background: value === o.id ? '#ffffff' : 'transparent',
          color: value === o.id ? '#1d1d1f' : '#86868b',
          boxShadow: value === o.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          {o.icon && <span style={{ display: 'flex', color: value === o.id ? '#0071e3' : '#aeaeb2' }}>{o.icon}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PillButton({ active, onClick, label, icon }: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        border: 'none',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: active ? '#0071e3' : '#f5f5f7',
        color: active ? '#ffffff' : '#86868b',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {icon && <span style={{ display: 'flex' }}>{icon}</span>}
      {label}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 20, background: '#e8e8ed', margin: '0 2px' }} />;
}
