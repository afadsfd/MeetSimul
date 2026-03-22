import { useState, useEffect, useCallback } from 'react';
import type { Settings } from '../types';

import { invoke } from '@tauri-apps/api/core';

const defaultSettings: Settings = {
  mode: 'cloud',
  voice: 'Guy',
  local_voice: '',
  real_time_translate: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (invoke) {
      invoke<Settings>('get_settings').then((s) => {
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
