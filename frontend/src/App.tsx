import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import TranslationPanel from './components/TranslationPanel';
import HistoryPanel from './components/HistoryPanel';
import Onboarding from './components/Onboarding';
import BlackholeModal from './components/BlackholeModal';
import SettingsPage from './components/SettingsPage';
import GlossaryEditor from './components/GlossaryEditor';
import { useSettings } from './hooks/useSettings';
import { useTranslation } from './hooks/useTranslation';
import type { AppView } from './types';

import { invoke } from '@tauri-apps/api/core';

export default function App() {
  const { settings, updateSettings, loaded } = useSettings();
  const {
    translation,
    isSpeaking,
    isTranslating,
    history,
    translateAndSpeak,
    debouncedTranslateOnly,
    stopSpeaking,
    clearHistory,
  } = useTranslation(settings);

  const [view, setView] = useState<AppView>('main');
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('meetsimul_onboarding_done')
  );
  const [showBlackholeWarning, setShowBlackholeWarning] = useState(false);

  // Check BlackHole on mount
  useEffect(() => {
    if (invoke) {
      invoke<boolean>('check_blackhole_installed').then((ok) => {
        if (!ok) setShowBlackholeWarning(true);
      }).catch(() => {});
    }
  }, []);

  // Mini mode: set always on top + resize window
  useEffect(() => {
    if (!invoke) return;
    invoke('set_always_on_top', { onTop: settings.mini_mode }).catch(() => {});
    if (settings.mini_mode) {
      invoke('set_window_size', { width: 400, height: 300 }).catch(() => {});
    } else {
      invoke('set_window_size', { width: 1000, height: 700 }).catch(() => {});
    }
  }, [settings.mini_mode]);

  // Keyboard shortcuts
  const handleKeyboard = useCallback((e: KeyboardEvent) => {
    // Don't capture when typing in textarea/input
    const tag = (e.target as HTMLElement)?.tagName;
    const isTyping = tag === 'TEXTAREA' || tag === 'INPUT';

    // Esc: stop speaking (always works)
    if (e.key === 'Escape') {
      e.preventDefault();
      stopSpeaking();
      return;
    }

    // Cmd+M: toggle mini mode
    if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
      e.preventDefault();
      updateSettings({ mini_mode: !settings.mini_mode });
      return;
    }

    // Cmd+Shift+M: toggle mic (won't conflict with typing)
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'M') {
      e.preventDefault();
      // Dispatch custom event for InputPanel to handle
      window.dispatchEvent(new CustomEvent('toggle-mic'));
      return;
    }
  }, [stopSpeaking, settings.mini_mode, updateSettings]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  if (!loaded) return null;

  // Mini mode: compact view
  if (settings.mini_mode && view === 'main') {
    return (
      <div style={{
        height: '100vh',
        background: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
        color: '#1d1d1f',
        display: 'flex',
        flexDirection: 'column',
        WebkitFontSmoothing: 'antialiased',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Mini header */}
        <div style={{
          // @ts-ignore
          WebkitAppRegion: 'drag',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f5',
          background: '#f9f9fb',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#86868b' }}>会议同传</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {isSpeaking && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 2, height: 10, borderRadius: 1,
                    background: '#0071e3',
                    animation: `pulse 0.8s ${i * 0.15}s infinite ease-in-out`,
                  }} />
                ))}
              </div>
            )}
            {/* @ts-ignore */}
            <button
              onClick={() => updateSettings({ mini_mode: false })}
              style={{
                // @ts-ignore
                WebkitAppRegion: 'no-drag',
                border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 11, color: '#0071e3', fontWeight: 500,
                padding: '2px 6px', borderRadius: 4,
              }}
            >
              展开
            </button>
          </div>
        </div>

        {/* Translation display */}
        <div style={{
          flex: 1, padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'auto',
        }}>
          <p style={{
            fontSize: 22, fontWeight: 600, lineHeight: 1.4,
            color: '#1d1d1f', textAlign: 'center',
            animation: translation ? 'fadeIn 0.3s ease' : 'none',
          }}>
            {translation || '等待翻译...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
      color: '#1d1d1f',
      display: 'flex',
      flexDirection: 'column',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Modals */}
      {showOnboarding && <Onboarding onFinish={() => setShowOnboarding(false)} />}
      {showBlackholeWarning && !showOnboarding && (
        <BlackholeModal onClose={() => setShowBlackholeWarning(false)} />
      )}

      {/* Header — always visible */}
      <Header
        settings={settings}
        onUpdateSettings={updateSettings}
        onOpenSettings={() => setView('settings')}
        onNavigate={setView}
        isSpeaking={isSpeaking}
      />

      {/* Views */}
      {view === 'main' && (
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px 20px',
          gap: 14,
          maxWidth: 960,
          width: '100%',
          margin: '0 auto',
        }}>
          <InputPanel
            onTranslateAndSpeak={translateAndSpeak}
            onDebouncedTranslate={debouncedTranslateOnly}
            onStopSpeaking={stopSpeaking}
            isSpeaking={isSpeaking}
            isTranslating={isTranslating}
            realTimeTranslate={settings.real_time_translate}
          />
          <TranslationPanel
            translation={translation}
            isSpeaking={isSpeaking}
          />
          <HistoryPanel
            history={history}
            onClear={clearHistory}
          />
        </main>
      )}

      {view === 'settings' && (
        <SettingsPage
          settings={settings}
          onUpdateSettings={updateSettings}
          onNavigate={setView}
        />
      )}

      {view === 'glossary' && (
        <GlossaryEditor onNavigate={setView} />
      )}
    </div>
  );
}
