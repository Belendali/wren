"""读 .env，判断哪些 provider 现在是活的。

产品的设计前提：key 是后填的。所以任何一个 provider 缺席都不能让流程断掉 ——
缺 Anthropic 就用本地模板写稿，缺 TTS 就让浏览器自己念。
"""
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
CACHE_DIR = ROOT / "cache"
AUDIO_DIR = CACHE_DIR / "audio"


def load_env() -> None:
    """把 .env 读进 os.environ。已经存在的环境变量优先，不覆盖。"""
    if not ENV_FILE.exists():
        return
    for raw in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and value and key not in os.environ:
            os.environ[key] = value


def get(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


# ── 文案模型 ────────────────────────────────────────
def anthropic_key() -> str:
    return get("ANTHROPIC_API_KEY")


def anthropic_model() -> str:
    return get("WREN_MODEL", "claude-opus-5")


# ── 语音合成 ────────────────────────────────────────
def tts_provider() -> str:
    """显式指定优先；否则谁有 key 用谁。都没有就交给浏览器。"""
    forced = get("WREN_TTS_PROVIDER").lower()
    if forced in ("elevenlabs", "openai", "browser"):
        return forced
    if get("ELEVENLABS_API_KEY"):
        return "elevenlabs"
    if get("OPENAI_API_KEY"):
        return "openai"
    return "browser"


def elevenlabs_key() -> str:
    return get("ELEVENLABS_API_KEY")


def elevenlabs_voice() -> str:
    # 默认 Matilda —— ElevenLabs 预置库里最接近「引导冥想」的女声之一
    return get("ELEVENLABS_VOICE_ID", "XrExE9yKIg1WjnnlVkGX")


def elevenlabs_model() -> str:
    return get("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")


def openai_key() -> str:
    return get("OPENAI_API_KEY")


def openai_voice() -> str:
    return get("OPENAI_TTS_VOICE", "shimmer")


def openai_tts_model() -> str:
    return get("OPENAI_TTS_MODEL", "gpt-4o-mini-tts")


def status() -> dict:
    """给前端的能力清单。前端据此决定用真音频还是浏览器合成。"""
    provider = tts_provider()
    return {
        "script": "claude" if anthropic_key() else "template",
        "model": anthropic_model() if anthropic_key() else None,
        "tts": provider,
        "voice": {
            "elevenlabs": elevenlabs_voice(),
            "openai": openai_voice(),
            "browser": None,
        }[provider],
    }
