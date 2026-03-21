import React, { useState } from 'react';
import { Volume2, Mic, Headphones } from 'lucide-react';

const STEPS = [
  {
    icon: <Volume2 size={28} color="#0071e3" />,
    title: '安装虚拟麦克风',
    desc: '按照系统弹窗提示，完成虚拟麦克风自动安装，搭建音频传输通道。',
  },
  {
    icon: <Mic size={28} color="#0071e3" />,
    title: '准备语音输入法',
    desc: '提前安装讯飞输入法，保障语音输入流畅。',
  },
  {
    icon: <Headphones size={28} color="#0071e3" />,
    title: '切换会议麦克风',
    desc: '在会议软件中，将麦克风输入改为虚拟麦克风即可生效。',
  },
];

export default function Onboarding({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200,
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: '36px 32px 28px',
        maxWidth: 400, width: '88%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{
            fontSize: 11, fontWeight: 600, color: '#0071e3',
            letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6,
          }}>
            新手引导
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.3px' }}>
            三步快速上手
          </h2>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 24 : 8, height: 8,
              borderRadius: 4,
              background: i === step ? '#0071e3' : i < step ? '#34c759' : '#e8e8ed',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          ))}
        </div>

        {/* Step content */}
        <div style={{
          background: '#f5f5f7',
          borderRadius: 14, padding: '28px 24px',
          textAlign: 'center',
          minHeight: 180,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            {STEPS[step].icon}
          </div>
          <div style={{
            fontSize: 12, fontWeight: 600, color: '#0071e3',
            marginBottom: 6, letterSpacing: 0.5,
          }}>
            第 {step + 1} 步
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>
            {STEPS[step].title}
          </h3>
          <p style={{
            fontSize: 13, color: '#86868b', lineHeight: 1.7,
            maxWidth: 280,
          }}>
            {STEPS[step].desc}
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{
              flex: 1, padding: '11px 0', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: '#f5f5f7', color: '#86868b',
              transition: 'all 0.2s',
            }}>
              上一步
            </button>
          )}
          <button
            onClick={() => {
              if (step < STEPS.length - 1) {
                setStep(step + 1);
              } else {
                localStorage.setItem('meetsimul_onboarding_done', '1');
                onFinish();
              }
            }}
            style={{
              flex: 1, padding: '11px 0', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: '#0071e3', color: '#fff',
              transition: 'all 0.2s',
            }}
          >
            {step < STEPS.length - 1 ? '下一步' : '开始使用'}
          </button>
        </div>

        {step < STEPS.length - 1 && (
          <button
            onClick={() => { localStorage.setItem('meetsimul_onboarding_done', '1'); onFinish(); }}
            style={{
              display: 'block', margin: '12px auto 0', background: 'none',
              border: 'none', color: '#aeaeb2', fontSize: 12, cursor: 'pointer',
            }}
          >
            跳过引导
          </button>
        )}
      </div>
    </div>
  );
}
