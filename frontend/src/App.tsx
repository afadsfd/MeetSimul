import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import TranslationPanel from './components/TranslationPanel';
import Onboarding from './components/Onboarding';
import BlackholeModal from './components/BlackholeModal';
import SettingsPage from './components/SettingsPage';
import GlossaryEditor from './components/GlossaryEditor';
import VoiceSelector from './components/VoiceSelector';
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
    translateAndSpeak,
    debouncedTranslateOnly,
    stopSpeaking,
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

  if (!loaded) return null;

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

      {view === 'voices' && (
        <VoiceSelector
          settings={settings}
          onUpdateSettings={updateSettings}
          onNavigate={setView}
        />
      )}
    </div>
  );
}
