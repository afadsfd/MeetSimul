import React, { useRef, useEffect } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import type { HistoryItem } from '../types';

interface HistoryPanelProps {
  history: HistoryItem[];
  onClear: () => void;
}

export default function HistoryPanel({ history, onClear }: HistoryPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new items added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);

  if (history.length === 0) return null;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 14,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      border: '1px solid #e8e8ed',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f5',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={13} color="#86868b" />
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#86868b',
            letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            翻译记录 ({history.length})
          </span>
        </div>
        <button onClick={onClear} style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          color: '#aeaeb2', display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, padding: '2px 6px', borderRadius: 4,
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ff3b30'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#aeaeb2'; }}
        >
          <Trash2 size={11} />
          清除
        </button>
      </div>

      {/* Scrollable list */}
      <div ref={scrollRef} style={{
        maxHeight: 200,
        overflowY: 'auto',
        padding: '4px 0',
      }}>
        {history.map((item, i) => (
          <div key={item.id} style={{
            padding: '8px 16px',
            borderBottom: i < history.length - 1 ? '1px solid #f8f8fa' : 'none',
            animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3,
            }}>
              <span style={{ fontSize: 10, color: '#aeaeb2', fontFamily: 'monospace' }}>
                {item.time}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#86868b', marginBottom: 2 }}>
              {item.zh}
            </div>
            <div style={{ fontSize: 13, color: '#1d1d1f', fontWeight: 500 }}>
              {item.en}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
