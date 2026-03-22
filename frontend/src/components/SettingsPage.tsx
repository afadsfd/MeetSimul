import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Cloud, Cpu, Download, Check, BookOpen, AudioLines, Loader, Mail, MessageCircle, User } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { listen as tauriListen } from '@tauri-apps/api/event';
import type { Settings, ModelStatus, AppView } from '../types';

interface DownloadProgress {
  model_id: string;
  downloaded: number;
  total: number;
  done: boolean;
  error: string | null;
}

interface SettingsPageProps {
  settings: Settings;
  onUpdateSettings: (partial: Partial<Settings>) => void;
  onNavigate: (view: AppView) => void;
}

export default function SettingsPage({ settings, onUpdateSettings, onNavigate }: SettingsPageProps) {
  const [modelStatus, setModelStatus] = useState<ModelStatus>({ asr: false, translation: false, tts: false });
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<Record<string, DownloadProgress>>({});
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    invoke<ModelStatus>('check_models_status').then(setModelStatus).catch(() => {});
    return () => { unlistenRef.current?.(); };
  }, []);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(null);
    setProgress({});

    // Listen for progress events
    unlistenRef.current = await tauriListen('download_progress', (event: { payload: DownloadProgress }) => {
      const p = event.payload;
      setProgress(prev => ({ ...prev, [p.model_id]: p }));
      if (p.error) {
        setDownloadError(p.error);
      }
    });

    try {
      await invoke('download_models');
      // Refresh status after download
      const status = await invoke<ModelStatus>('check_models_status');
      setModelStatus(status);
    } catch (e: any) {
      setDownloadError(typeof e === 'string' ? e : e?.message || '下载失败，请检查网络连接');
    } finally {
      setDownloading(false);
      unlistenRef.current?.();
      unlistenRef.current = null;
    }
  };

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
            <ModelRow label="语音识别 (SenseVoice)" ready={modelStatus.asr} size="~200MB" progress={progress['asr']} />
            <ModelRow label="翻译模型 (Qwen2.5-0.5B)" ready={modelStatus.translation} size="~400MB" progress={progress['translation']} />
            <ModelRow label="语音合成 (Piper TTS)" ready={modelStatus.tts} size="~60MB" progress={progress['tts']} />
          </div>
          {downloadError && (
            <div style={{
              marginTop: 8, padding: '8px 12px', background: '#fff2f0',
              borderRadius: 8, fontSize: 12, color: '#ff3b30',
            }}>
              {downloadError}
            </div>
          )}
          {!allModelsReady && (
            <button onClick={handleDownload} disabled={downloading} style={{
              marginTop: 12, width: '100%', padding: '10px 0',
              background: downloading ? '#86868b' : '#0071e3', color: '#fff', border: 'none',
              borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: downloading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}>
              {downloading ? (
                <>
                  <Loader size={14} style={{ marginRight: 6, verticalAlign: 'middle', animation: 'spin 1s linear infinite' }} />
                  下载中...
                </>
              ) : (
                <>
                  <Download size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  下载全部模型（约 660MB）
                </>
              )}
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
        会议同传 v2.0.7
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

function ModelRow({ label, ready, size, progress }: { label: string; ready: boolean; size: string; progress?: DownloadProgress }) {
  const isDownloading = progress && !progress.done && progress.total > 0;
  const percent = isDownloading ? Math.round((progress.downloaded / progress.total) * 100) : 0;
  const downloadedMB = progress ? (progress.downloaded / 1024 / 1024).toFixed(1) : '0';
  const totalMB = progress && progress.total > 0 ? (progress.total / 1024 / 1024).toFixed(0) : '?';

  return (
    <div style={{
      padding: '10px 14px', background: '#f5f5f7', borderRadius: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#1d1d1f' }}>{label}</div>
          <div style={{ fontSize: 11, color: '#aeaeb2' }}>
            {isDownloading ? `${downloadedMB} / ${totalMB} MB` : size}
          </div>
        </div>
        {ready || (progress?.done && !progress?.error) ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            color: '#34c759', fontSize: 12, fontWeight: 600,
          }}>
            <Check size={14} /> 已就绪
          </div>
        ) : isDownloading ? (
          <div style={{ fontSize: 12, color: '#0071e3', fontWeight: 600 }}>{percent}%</div>
        ) : progress?.error ? (
          <div style={{ fontSize: 12, color: '#ff3b30' }}>失败</div>
        ) : (
          <div style={{ fontSize: 12, color: '#aeaeb2' }}>未下载</div>
        )}
      </div>
      {isDownloading && (
        <div style={{
          marginTop: 8, height: 4, background: '#e5e5ea', borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', background: '#0071e3', borderRadius: 2,
            width: `${percent}%`, transition: 'width 0.3s ease',
          }} />
        </div>
      )}
    </div>
  );
}
