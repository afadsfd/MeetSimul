import React from 'react';
import { ArrowLeft, Cloud, Cpu, BookOpen, Mail, MessageCircle, User, Minimize2, Keyboard } from 'lucide-react';
import type { Settings, AppView } from '../types';

interface SettingsPageProps {
  settings: Settings;
  onUpdateSettings: (partial: Partial<Settings>) => void;
  onNavigate: (view: AppView) => void;
}

export default function SettingsPage({ settings, onUpdateSettings, onNavigate }: SettingsPageProps) {
  const speedLabel = (s: number) => {
    if (s <= 0.8) return '慢速';
    if (s >= 1.3) return '快速';
    if (s === 1.0) return '正常';
    return `${s.toFixed(1)}x`;
  };

  return (
    <div style={{
      flex: 1,
      padding: '0 20px 20px',
      overflow: 'auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '16px 0',
      }}>
        <button onClick={() => onNavigate('main')} style={{
          width: 32, height: 32, border: 'none', borderRadius: 8,
          background: '#f5f5f7', color: '#86868b',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          <ArrowLeft size={16} />
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f' }}>设置</h2>
      </div>

      {/* Mode Switch */}
      <SettingsSection title="翻译模式">
        <div style={{
          display: 'flex',
          background: '#f5f5f7',
          borderRadius: 10,
          padding: 3,
          gap: 3,
        }}>
          {[
            { id: 'cloud' as const, label: '云端模式', icon: <Cloud size={14} />, desc: 'Google 翻译 + Edge TTS' },
            { id: 'local' as const, label: '本地模式', icon: <Cpu size={14} />, desc: 'Google 翻译 + macOS 语音' },
          ].map(m => (
            <button key={m.id} onClick={() => onUpdateSettings({ mode: m.id })} style={{
              flex: 1, padding: '10px 14px', border: 'none', borderRadius: 8,
              background: settings.mode === m.id ? '#ffffff' : 'transparent',
              boxShadow: settings.mode === m.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ color: settings.mode === m.id ? '#0071e3' : '#86868b' }}>{m.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: settings.mode === m.id ? '#1d1d1f' : '#86868b',
                }}>{m.label}</div>
                <div style={{ fontSize: 11, color: '#aeaeb2' }}>{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* TTS Speed */}
      <SettingsSection title="语音速度">
        <div style={{
          padding: '14px 16px',
          background: '#f5f5f7', borderRadius: 10,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 10,
          }}>
            <span style={{ fontSize: 13, color: '#1d1d1f', fontWeight: 500 }}>
              播放速度
            </span>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: '#0071e3',
              background: '#0071e310',
              padding: '2px 10px',
              borderRadius: 6,
            }}>
              {settings.tts_speed.toFixed(1)}x · {speedLabel(settings.tts_speed)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#aeaeb2' }}>0.8x</span>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.1"
              value={settings.tts_speed}
              onChange={(e) => onUpdateSettings({ tts_speed: parseFloat(e.target.value) })}
              style={{
                flex: 1, height: 4,
                appearance: 'none',
                background: `linear-gradient(to right, #0071e3 ${((settings.tts_speed - 0.8) / 0.7) * 100}%, #e8e8ed ${((settings.tts_speed - 0.8) / 0.7) * 100}%)`,
                borderRadius: 2,
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: 11, color: '#aeaeb2' }}>1.5x</span>
          </div>
        </div>
      </SettingsSection>

      {/* Mini Mode */}
      <SettingsSection title="窗口模式">
        <button onClick={() => onUpdateSettings({ mini_mode: !settings.mini_mode })} style={{
          width: '100%', padding: '12px 14px',
          background: settings.mini_mode ? '#0071e308' : '#f5f5f7',
          border: settings.mini_mode ? '1px solid #0071e330' : '1px solid transparent',
          borderRadius: 10,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
          transition: 'all 0.2s',
        }}>
          <Minimize2 size={18} color={settings.mini_mode ? '#0071e3' : '#86868b'} />
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: settings.mini_mode ? '#0071e3' : '#1d1d1f',
            }}>迷你悬浮窗</div>
            <div style={{ fontSize: 11, color: '#86868b' }}>
              小窗口始终置顶，只显示翻译结果（⌘M 快速切换）
            </div>
          </div>
          <div style={{
            width: 40, height: 22, borderRadius: 11,
            background: settings.mini_mode ? '#0071e3' : '#e8e8ed',
            position: 'relative', transition: 'background 0.2s',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              background: '#ffffff',
              position: 'absolute', top: 2,
              left: settings.mini_mode ? 20 : 2,
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }} />
          </div>
        </button>
      </SettingsSection>

      {/* Glossary */}
      <SettingsSection title="术语管理">
        <button onClick={() => onNavigate('glossary')} style={{
          width: '100%', padding: '12px 14px',
          background: '#f5f5f7', border: 'none', borderRadius: 10,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
          transition: 'all 0.2s',
        }}>
          <BookOpen size={18} color="#0071e3" />
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f' }}>自定义术语表</div>
            <div style={{ fontSize: 11, color: '#86868b' }}>添加专业词汇和人名，提升翻译准确度</div>
          </div>
          <ArrowLeft size={14} color="#aeaeb2" style={{ transform: 'rotate(180deg)' }} />
        </button>
      </SettingsSection>

      {/* Keyboard Shortcuts */}
      <SettingsSection title="快捷键">
        <div style={{
          padding: '12px 16px',
          background: '#f5f5f7', borderRadius: 10,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <ShortcutRow keys="Esc" desc="停止播放" />
          <ShortcutRow keys="⌘ M" desc="切换迷你悬浮窗" />
          <ShortcutRow keys="⌘ ⇧ M" desc="开始 / 停止语音输入" />
          <ShortcutRow keys="Enter" desc="翻译并播放（非边说边译模式）" />
        </div>
      </SettingsSection>

      {/* Contact Developer */}
      <SettingsSection title="联系开发者">
        <div style={{
          padding: '14px 16px',
          background: '#f5f5f7',
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{ fontSize: 13, color: '#86868b', lineHeight: 1.6 }}>
            如果您有任何建议或问题，欢迎联系开发者
          </div>
          <ContactRow icon={<User size={14} color="#0071e3" />} label="开发者" value="ZeroAI" />
          <ContactRow icon={<Mail size={14} color="#0071e3" />} label="邮箱" value="lz3862680@gmail.com" />
          <ContactRow icon={<MessageCircle size={14} color="#0071e3" />} label="Telegram" value="@sky87531" />
        </div>
      </SettingsSection>

      {/* Version */}
      <div style={{
        textAlign: 'center',
        padding: '8px 0 20px',
        fontSize: 11,
        color: '#aeaeb2',
      }}>
        会议同传 v2.2.0
      </div>
    </div>
  );
}

function ShortcutRow({ keys, desc }: { keys: string; desc: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: '#86868b' }}>{desc}</span>
      <kbd style={{
        fontSize: 11, fontWeight: 600, color: '#1d1d1f',
        background: '#ffffff', padding: '2px 8px', borderRadius: 5,
        border: '1px solid #e8e8ed',
        fontFamily: '-apple-system, system-ui, sans-serif',
      }}>{keys}</kbd>
    </div>
  );
}

function ContactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 12, color: '#aeaeb2', minWidth: 52 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#1d1d1f' }}>{value}</span>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{
        fontSize: 12, fontWeight: 600, color: '#86868b',
        letterSpacing: '0.3px', marginBottom: 8,
        textTransform: 'uppercase',
      }}>{title}</h3>
      {children}
    </div>
  );
}
