import React from 'react';
import { Languages } from 'lucide-react';

interface TranslationPanelProps {
  translation: string;
  isSpeaking: boolean;
}

export default function TranslationPanel({ translation, isSpeaking }: TranslationPanelProps) {
  if (!translation) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        borderRadius: 14,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #e8e8ed',
        padding: 40,
        minHeight: 200,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: '#f5f5f7',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14,
        }}>
          <Languages size={24} color="#d2d2d7" />
        </div>
        <p style={{ fontSize: 14, color: '#aeaeb2', fontWeight: 500 }}>
          翻译结果将在此显示
        </p>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      background: '#ffffff',
      borderRadius: 14,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      border: '1px solid #e8e8ed',
      padding: '20px 24px',
      minHeight: 200,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 14,
      }}>
        <Languages size={13} color="#86868b" />
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#86868b',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          Translation
        </span>
        {isSpeaking && (
          <div style={{
            marginLeft: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 3, height: 12, borderRadius: 2,
                background: '#0071e3',
                animation: `pulse 0.8s ${i * 0.15}s infinite ease-in-out`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Translation text */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
        <p style={{
          fontSize: 28,
          fontWeight: 600,
          lineHeight: 1.3,
          letterSpacing: '-0.3px',
          color: '#1d1d1f',
          animation: 'fadeIn 0.3s ease',
        }}>
          {translation}
        </p>
      </div>
    </div>
  );
}
