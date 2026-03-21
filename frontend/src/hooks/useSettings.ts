import { useState, useEffect, useCallback } from 'react';
import type { Settings } from '../types';

const invoke = (window as any).__TAURI__?.core?.invoke;

const defaultSettings: Settings = {
  mode: 'cloud',
  voice: 'Guy',
  real_time_translate: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (invoke) {
      invoke('get_settings').then((s: Settings) => {
        setSettings(s);
        setLoaded(true);
      }).catch(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, []);

  const updateSettings = useCallback(async (partial: Partial<Settings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    if (invoke) {
      try {
        await invoke('save_settings', { settings: next });
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
    }
  }, [settings]);

  return { settings, updateSettings, loaded };
}
