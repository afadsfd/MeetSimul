import React from 'react';
import { ArrowLeft, Cloud, Cpu, BookOpen, Mail, MessageCircle, User } from 'lucide-react';
import type { Settings, AppView } from '../types';

interface SettingsPageProps {
  settings: Settings;
  onUpdateSettings: (partial: Partial<Settings>) => void;
  onNavigate: (view: AppView) => void;
}

export default function SettingsPage({ settings, onUpdateSettings, onNavigate }: SettingsPageProps) {
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
        {settings.mode === 'local' && (
          <div style={{
            marginTop: 8, padding: '10px 14px',
            background: '#f0f7ff', borderRadius: 8,
            fontSize: 12, color: '#0071e3', lineHeight: 1.6,
          }}>
            本地模式使用 macOS 系统语音朗读，延迟更低。建议在「系统设置 → 辅助功能 → 朗读内容 → 系统语音」中下载高级英文语音包以获得更好的音质。
          </div>
        )}
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

      {/* Voice info */}
      <SettingsSection title="语音设置">
        <div style={{
          padding: '12px 14px',
          background: '#f5f5f7', borderRadius: 10,
          fontSize: 13, color: '#86868b', lineHeight: 1.6,
        }}>
          在顶部控制栏切换「男声 / 女声」。云端模式使用 Edge TTS 高品质语音，本地模式使用 macOS 系统语音。
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
        会议同传 v2.1.0
      </div>
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
