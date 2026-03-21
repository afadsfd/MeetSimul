import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { invoke } from '@tauri-apps/api/core';

interface BlackholeModalProps {
  onClose: () => void;
}

export default function BlackholeModal({ onClose }: BlackholeModalProps) {
  const [status, setStatus] = useState<'idle' | 'installing' | 'done' | 'error'>('idle');

  const handleInstall = async () => {
    setStatus('installing');
    try {
      await invoke('install_blackhole');
      setTimeout(async () => {
        const ok = await invoke('check_blackhole_installed');
        setStatus(ok ? 'done' : 'idle');
      }, 3000);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: '28px 24px',
        maxWidth: 360, width: '90%',
        textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: status === 'done' ? '#34c75910' : status === 'error' ? '#ff3b3010' : '#0071e310',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px', fontSize: 28,
        }}>
          {status === 'done' ? '✅' : status === 'error' ? '❌' : '🎙️'}
        </div>

        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: '#1d1d1f' }}>
          {status === 'done' ? '安装完成' : status === 'error' ? '安装异常' : '需要安装虚拟麦克风'}
        </h3>
        <p style={{ fontSize: 13, color: '#86868b', lineHeight: 1.7, marginBottom: 20 }}>
          {status === 'done'
            ? '虚拟麦克风已就绪，可在会议软件中选择 BlackHole 2ch 作为麦克风输入。'
            : status === 'error'
            ? '请手动访问 existential.audio/blackhole 下载安装。'
            : '会议同传需要 BlackHole 虚拟麦克风。已内置安装包，无需下载。'}
        </p>

        {status === 'installing' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 0', color: '#0071e3', fontSize: 13, marginBottom: 12,
          }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            安装向导已启动，请按照系统提示操作…
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {status === 'idle' && (
            <>
              <button onClick={handleInstall} style={{
                padding: '11px 0', background: '#0071e3', color: '#fff', border: 'none',
                borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>
                一键安装虚拟麦克风
              </button>
              <button onClick={onClose} style={{
                padding: '10px 0', background: 'transparent', color: '#aeaeb2', border: 'none',
                fontSize: 12, cursor: 'pointer',
              }}>
                稍后再装
              </button>
            </>
          )}
          {(status === 'done' || status === 'error') && (
            <button onClick={onClose} style={{
              padding: '11px 0', background: '#0071e3', color: '#fff', border: 'none',
              borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              {status === 'done' ? '开始使用' : '我知道了'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
