"""语音合成。按段落合成，磁盘缓存，key 未填时留给浏览器。

为什么按段落而不是整稿一次：
  · 段间静默要精确到 0.5 秒，交给客户端排程比塞进 SSML 可靠，也不挑 provider
  · 第一段合成完就能开始放，Story Intro 那个进度条是真的进度
  · 同一句话在三段稿子里重复出现（carry 那句念两遍）只合成一次
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import threading
import urllib.error
import urllib.request

from . import config

_locks_guard = threading.Lock()
_locks = {}
_failed = {}


def _lock_for(key: str) -> threading.Lock:
    with _locks_guard:
        if key not in _locks:
            _locks[key] = threading.Lock()
        return _locks[key]


def available() -> bool:
    return config.tts_provider() in ("elevenlabs", "openai")


def key_for(text: str) -> str:
    """同一句话 + 同一把嗓子 = 同一个文件。换 provider 自动失效。"""
    provider = config.tts_provider()
    voice = {
        "elevenlabs": "%s/%s" % (config.elevenlabs_voice(), config.elevenlabs_model()),
        "openai": "%s/%s" % (config.openai_voice(), config.openai_tts_model()),
        "browser": "browser",
    }[provider]
    digest = hashlib.sha1(("%s|%s|%s" % (provider, voice, text.strip())).encode("utf-8"))
    return digest.hexdigest()


def path_for(key: str):
    return config.AUDIO_DIR / ("%s.mp3" % key)


def is_ready(key: str) -> bool:
    p = path_for(key)
    return p.exists() and p.stat().st_size > 0


# ── provider 实现 ────────────────────────────────────

def _post(url: str, payload: dict, headers: dict, timeout: int = 120) -> bytes:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def _elevenlabs(text: str) -> bytes:
    url = "https://api.elevenlabs.io/v1/text-to-speech/%s?output_format=mp3_44100_128" % config.elevenlabs_voice()
    return _post(
        url,
        {
            "text": text,
            "model_id": config.elevenlabs_model(),
            # 引导冥想要的是稳，不是表现力。stability 高、style 压到 0。
            "voice_settings": {
                "stability": 0.55,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True,
                "speed": 0.85,
            },
        },
        {
            "xi-api-key": config.elevenlabs_key(),
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
    )


def _openai(text: str) -> bytes:
    return _post(
        "https://api.openai.com/v1/audio/speech",
        {
            "model": config.openai_tts_model(),
            "voice": config.openai_voice(),
            "input": text,
            "instructions": (
                "Speak as a meditation guide: unhurried, low and warm, almost quiet. "
                "Leave the sentence endings open rather than landing them hard. "
                "Never sound bright, encouraging, or announcer-like."
            ),
            "response_format": "mp3",
            "speed": 0.9,
        },
        {
            "Authorization": "Bearer %s" % config.openai_key(),
            "Content-Type": "application/json",
        },
    )


def _synthesize(text: str) -> bytes:
    provider = config.tts_provider()
    if provider == "elevenlabs":
        return _elevenlabs(text)
    if provider == "openai":
        return _openai(text)
    raise RuntimeError("没有可用的 TTS provider")


# ── 对外 ────────────────────────────────────────────

def ensure(text: str):
    """拿到这句话的音频文件路径，没有就现合成。同一句话并发只合成一次。"""
    if not available():
        return None
    key = key_for(text)
    if is_ready(key):
        return path_for(key)
    if _failed.get(key, 0) >= 2:
        return None

    with _lock_for(key):
        if is_ready(key):
            return path_for(key)
        try:
            audio = _synthesize(text)
        except urllib.error.HTTPError as exc:
            detail = exc.read()[:400].decode("utf-8", "replace")
            print("[wren] TTS %s 失败 %s：%s" % (config.tts_provider(), exc.code, detail), file=sys.stderr)
            _failed[key] = _failed.get(key, 0) + 1
            return None
        except Exception as exc:  # noqa: BLE001
            print("[wren] TTS 失败：%s" % exc, file=sys.stderr)
            _failed[key] = _failed.get(key, 0) + 1
            return None

        config.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        tmp = path_for(key).with_suffix(".part")
        tmp.write_bytes(audio)
        os.replace(str(tmp), str(path_for(key)))
        return path_for(key)


def warm(texts, workers: int = 3) -> None:
    """后台预热。她还在看 Vision Picker 的时候，音频已经在合成了。"""
    if not available():
        return
    todo = [t for t in dict.fromkeys(texts) if t and not is_ready(key_for(t))]
    if not todo:
        return

    def run(chunk):
        for text in chunk:
            ensure(text)

    for i in range(min(workers, len(todo))):
        threading.Thread(target=run, args=(todo[i::workers],), daemon=True).start()


def status_for(texts) -> dict:
    keys = [key_for(t) for t in texts]
    ready = [k for k in keys if is_ready(k)]
    return {
        "provider": config.tts_provider(),
        "total": len(keys),
        "ready": len(ready),
        "keys": keys,
    }
