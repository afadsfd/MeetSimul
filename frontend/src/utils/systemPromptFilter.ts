const SYSTEM_PROMPT_KEYWORDS = [
  'ding', 'beep', 'ping', 'success', '完成', '结束', 'dingdong',
  'pingsuccess', 'successsound', 'sounds', 'audio', 'voiceover',
  'speaking', 'listening', 'recording', 'dictation', '开始', '停止',
];

export function isSystemPrompt(text: string): boolean {
  const t = text.toLowerCase().trim();
  if (t.length < 5) {
    for (const kw of SYSTEM_PROMPT_KEYWORDS) {
      if (t.includes(kw)) return true;
    }
  }
  return false;
}
