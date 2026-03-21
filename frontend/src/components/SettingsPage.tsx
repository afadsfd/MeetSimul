import React, { useState, useEffect } from 'react';
import { ArrowLeft, Cloud, Cpu, Download, Check, BookOpen, AudioLines } from 'lucide-react';
import type { Settings, ModelStatus, AppView } from '../types';

const invoke = (window as any).__TAURI__?.core?.invoke;

interface SettingsPageProps {
  settings: Settings;
  onUpdateSettings: (partial: Partial<Settings>) => void;
  onNavigate: (view: AppView) => void;
}

export default function SettingsPage({ settings, onUpdateSettings, onNavigate }: SettingsPageProps) {
  const [modelStatus, setModelStatus] = useState<ModelStatus>({ asr: false, translation: false, tts: false });

  useEffect(() => {
    if (invoke) {
      invoke('check_models_status').then(setModelStatus).catch(() => {});
    }
  }, []);

  const allModelsReady = modelStatus.asr && modelStatus.translation && modelStatus.tts;

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
            { id: 'cloud' as const, label: '云端模式', icon: <Cloud size={14} />, desc: '使用在线翻译服务' },
            { id: 'local' as const, label: '本地模式', icon: <Cpu size={14} />, desc: '离线 AI 推理' },
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

      {/* Model Status */}
      {settings.mode === 'local' && (
        <SettingsSection title="模型状态">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ModelRow label="语音识别 (SenseVoice)" ready={modelStatus.asr} size="~200MB" />
            <ModelRow label="翻译模型 (Qwen3-0.6B)" ready={modelStatus.translation} size="~400MB" />
            <ModelRow label="语音合成 (Piper TTS)" ready={modelStatus.tts} size="~60MB" />
          </div>
          {!allModelsReady && (
            <button style={{
              marginTop: 12, width: '100%', padding: '10px 0',
              background: '#0071e3', color: '#fff', border: 'none',
              borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <Download size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              下载全部模型（约 660MB）
            </button>
          )}
        </SettingsSection>
      )}

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

      {/* Voices */}
      <SettingsSection title="语音设置">
        <button onClick={() => onNavigate('voices')} style={{
          width: '100%', padding: '12px 14px',
          background: '#f5f5f7', border: 'none', borderRadius: 10,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
          transition: 'all 0.2s',
        }}>
          <AudioLines size={18} color="#0071e3" />
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f' }}>语音选择</div>
            <div style={{ fontSize: 11, color: '#86868b' }}>选择翻译朗读音色</div>
          </div>
          <ArrowLeft size={14} color="#aeaeb2" style={{ transform: 'rotate(180deg)' }} />
        </button>
      </SettingsSection>
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

function ModelRow({ label, ready, size }: { label: string; ready: boolean; size: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', background: '#f5f5f7', borderRadius: 10,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#1d1d1f' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#aeaeb2' }}>{size}</div>
      </div>
      {ready ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          color: '#34c759', fontSize: 12, fontWeight: 600,
        }}>
          <Check size={14} /> 已就绪
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#aeaeb2' }}>未下载</div>
      )}
    </div>
  );
}
