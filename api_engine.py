import os
import requests
import threading
import asyncio
import edge_tts
from flask import Flask, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# 翻译缓存
translate_cache = {}

def translate_free(text):
    """使用Google翻译API + 缓存"""
    # 先检查缓存
    if text in translate_cache:
        return translate_cache[text]
    
    try:
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q={text}"
        r = requests.get(url, timeout=3)
        if r.status_code == 200:
            data = r.json()
            if data and data[0]:
                result = data[0][0][0]
                translate_cache[text] = result
                return result
        return text
    except: 
        # 备用有道翻译
        try:
            url = f"http://fanyi.youdao.com/translate?doctype=json&type=ZH_CN_EN&i={text}"
            headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}
            r = requests.get(url, timeout=3, headers=headers)
            if r.status_code == 200:
                data = r.json()
                if data.get('translateResult'):
                    result = data['translateResult'][0][0].get('tgt', text)
                    translate_cache[text] = result
                    return result
        except: pass
        return text

@socketio.on('update_text')
def handle_update(data):
    text = data.get('text', '')
    # 过滤苹果语音提示音
    if is_system_prompt(text):
        print(f"🔇 跳过系统提示音: {text}")
        return
    print(f"📝 收到文字更新: {text}")
    en_text = translate_free(text)
    emit('translation_live', {'en': en_text})

@socketio.on('speak_chunk')
def handle_speak(data):
    text = data.get('text', '')
    no_translate = data.get('noTranslate', False)
    voice = data.get('voice', 'Junior')
    use_edge_tts = data.get('useEdgeTTS', True)
    
    # 过滤苹果语音提示音
    if is_system_prompt(text):
        print(f"🔇 跳过系统提示音: {text}")
        return
    if text:
        if no_translate:
            # 不翻译，直接朗读原文
            en_text = text
            print(f"🔊 直接朗读英文: {text}")
        else:
            en_text = translate_free(text)
            print(f"🔊 原文: {text} -> 翻译: {en_text}")
        # 异步执行语音，不阻塞
        threading.Thread(target=speak_text, args=(en_text, voice, use_edge_tts), daemon=True).start()

def is_system_prompt(text):
    """检测是否为苹果系统语音提示音"""
    # 常见的苹果语音提示音文本
    prompt_keywords = [
        'ding', 'beep', 'ping', 'success', '完成', '结束', 'dingdong',
        'pingsuccess', 'successsound', 'sounds', 'audio', 'voiceover',
        'speaking', 'listening', 'recording', 'dictation'
    ]
    text_lower = text.lower().strip()
    # 如果文本很短且包含提示音关键词，或者是纯符号
    if len(text_lower) < 5:
        for keyword in prompt_keywords:
            if keyword in text_lower:
                return True
    return False

@socketio.on('stop_speak')
def handle_stop_speak():
    """停止当前朗读"""
    os.system("pkill -f 'say -v')")
    print("🛑 已停止朗读")

def speak_text(text, voice='Junior', use_edge_tts=True, max_len=2500):
    """朗读文本"""
    # 通知前端开始播放
    tts_type = "Edge" if use_edge_tts else "本地"
    socketio.emit('speak_status', {'status': 'playing', 'text': text[:50]})
    
    # 处理特殊字符
    safe_text = text.replace('"', '').replace("'", "").replace(";", "")
    
    if use_edge_tts:
        # 使用 Edge TTS
        if voice == 'Samantha':
            edge_voice = "en-US-JennyNeural"  # 女声
        else:
            edge_voice = "en-US-GuyNeural"    # 男声
        
        async def play_audio():
            try:
                communicate = edge_tts.Communicate(safe_text, edge_voice)
                await communicate.save("/tmp/edge_tts_output.mp3")
                os.system("afplay /tmp/edge_tts_output.mp3")
            except Exception as e:
                print(f"⚠️ Edge TTS 失败: {e}, 备用 macOS say")
                # 备用 macOS say
                if voice == 'Samantha':
                    voice_name = 'Samantha'
                else:
                    voice_name = 'Junior (English (US))'
                os.system(f"say -v '{voice_name}' -a 'BlackHole 2ch' \"{safe_text}\"")
        
        asyncio.run(play_audio())
    else:
        # 使用本地 macOS say
        if voice == 'Samantha':
            voice_name = 'Samantha'
        else:
            voice_name = 'Junior (English (US))'
        os.system(f"say -v '{voice_name}' -a 'BlackHole 2ch' \"{safe_text}\"")
    
    # 通知前端播放结束
    socketio.emit('speak_status', {'status': 'idle'})

if __name__ == "__main__":
    import sys
    venv_python = "/Users/zero/Desktop/EchoClone_Project/venv/bin/python"
    
    if sys.executable != venv_python:
        print(f"🔄 检测到虚拟环境，正在切换...")
        os.execv(venv_python, [venv_python] + sys.argv)
    
    print("🚀 后端引擎已启动，等待前端连接...")
    socketio.run(app, host='localhost', port=8765, allow_unsafe_werkzeug=True)
