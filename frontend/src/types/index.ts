export interface Settings {
  mode: 'local' | 'cloud';
  voice: string;
  local_voice: string;
  real_time_translate: boolean;
}

export interface GlossaryEntry {
  zh: string;
  en: string;
}

export interface TranslateResult {
  original: string;
  translated: string;
  time_ms: number;
  method: string;
}

export interface ModelStatus {
  asr: boolean;
  translation: boolean;
  tts: boolean;
}

export interface SystemVoice {
  name: string;
  lang: string;
  sample: string;
}

export type AppView = 'main' | 'settings' | 'glossary' | 'voices';
