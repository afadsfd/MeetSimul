import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import type { GlossaryEntry, AppView } from '../types';

import { invoke } from '@tauri-apps/api/core';

interface GlossaryEditorProps {
  onNavigate: (view: AppView) => void;
}

export default function GlossaryEditor({ onNavigate }: GlossaryEditorProps) {
  const [entries, setEntries] = useState<GlossaryEntry[]>([]);
  const [newZh, setNewZh] = useState('');
  const [newEn, setNewEn] = useState('');

  useEffect(() => {
    if (invoke) {
      invoke<GlossaryEntry[]>('get_glossary').then(setEntries).catch(() => {});
    }
  }, []);

  const save = async (updated: GlossaryEntry[]) => {
    setEntries(updated);
    if (invoke) {
      try { await invoke('save_glossary', { entries: updated }); } catch {}
    }
  };

  const addEntry = () => {
    if (!newZh.trim() || !newEn.trim()) return;
    save([...entries, { zh: newZh.trim(), en: newEn.trim() }]);
    setNewZh('');
    setNewEn('');
  };

  const removeEntry = (index: number) => {
    save(entries.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEntry();
    }
  };

  return (
    <div style={{ flex: 1, padding: '0 20px 20px', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0' }}>
        <button onClick={() => onNavigate('settings')} style={{
          width: 32, height: 32, border: 'none', borderRadius: 8,
          background: '#f5f5f7', color: '#86868b',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowLeft size={16} />
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f' }}>术语管理</h2>
        <span style={{ fontSize: 12, color: '#aeaeb2' }}>{entries.length} 条术语</span>
      </div>

      {/* Add new entry */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 16,
        background: '#ffffff', borderRadius: 12, padding: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8e8ed',
      }}>
        <input
          value={newZh}
          onChange={e => setNewZh(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="中文术语"
          style={{
            flex: 1, padding: '8px 12px', border: '1px solid #e8e8ed',
            borderRadius: 8, fontSize: 13, outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = '#0071e3'}
          onBlur={e => e.target.style.borderColor = '#e8e8ed'}
        />
        <input
          value={newEn}
          onChange={e => setNewEn(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="English translation"
          style={{
            flex: 1, padding: '8px 12px', border: '1px solid #e8e8ed',
            borderRadius: 8, fontSize: 13, outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = '#0071e3'}
          onBlur={e => e.target.style.borderColor = '#e8e8ed'}
        />
        <button onClick={addEntry} style={{
          width: 36, height: 36, border: 'none', borderRadius: 8,
          background: newZh.trim() && newEn.trim() ? '#0071e3' : '#e8e8ed',
          color: newZh.trim() && newEn.trim() ? '#fff' : '#aeaeb2',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          <Plus size={16} />
        </button>
      </div>

      {/* Entries */}
      <div style={{
        background: '#ffffff', borderRadius: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8e8ed',
        overflow: 'hidden',
      }}>
        {entries.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#aeaeb2', fontSize: 13 }}>
            还没有术语。添加术语以提升翻译准确度。
          </div>
        ) : (
          entries.map((entry, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', padding: '10px 14px',
              borderBottom: i < entries.length - 1 ? '1px solid #f0f0f5' : 'none',
              gap: 12,
            }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#1d1d1f' }}>
                {entry.zh}
              </span>
              <span style={{ color: '#d2d2d7', fontSize: 12 }}>→</span>
              <span style={{ flex: 1, fontSize: 13, color: '#86868b' }}>
                {entry.en}
              </span>
              <button onClick={() => removeEntry(i)} style={{
                width: 28, height: 28, border: 'none', borderRadius: 6,
                background: 'transparent', color: '#aeaeb2', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ff3b3010'; e.currentTarget.style.color = '#ff3b30'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#aeaeb2'; }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
