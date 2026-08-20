#!/usr/bin/env python3
"""Wren —— 静态站 + 生成 API。只依赖标准库（Claude SDK 可选）。

    python3 serve.py            # 8471
    python3 serve.py --port 9000

接口：
    GET  /api/config                     哪些 provider 是活的
    POST /api/clarify   {intent,profile}  这句话够不够具体
    POST /api/generate  {intent,profile}  三段稿子
    POST /api/tts/status {texts:[...]}    这些句子合成到哪儿了
    GET  /api/audio/<key>.mp3             一句话的音频（没有就现合成）
"""
from __future__ import annotations

import argparse
import json
import sys
import traceback
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

# 本地 .venv 里的包也认 —— launch.json 用的是系统 python3，
# 不这样的话装好的 anthropic SDK 会找不到。
for site in sorted(ROOT.glob(".venv/lib/python*/site-packages")):
    sys.path.append(str(site))

from wren import config, generate, tts  # noqa: E402

config.load_env()
WEB = Path(__file__).resolve().parent / "web"
MAX_BODY = 256 * 1024


class Handler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB), **kwargs)

    # ── 工具 ────────────────────────────────────────
    def _json(self, payload, status: int = 200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8") or "{}")

    def _audio(self, key: str):
        path = tts.path_for(key)
        if not path.exists():
            self._json({"error": "not-ready"}, 404)
            return
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        self.send_header("Accept-Ranges", "none")
        self.end_headers()
        self.wfile.write(data)

    # ── 路由 ────────────────────────────────────────
    def do_GET(self):  # noqa: N802
        if self.path == "/api/config":
            return self._json(config.status())

        if self.path.startswith("/api/audio/"):
            key = self.path.rsplit("/", 1)[-1].split("?")[0].replace(".mp3", "")
            if not key.isalnum() or len(key) != 40:
                return self._json({"error": "bad-key"}, 400)
            return self._audio(key)

        if self.path.startswith("/api/"):
            return self._json({"error": "not-found"}, 404)

        return super().do_GET()

    def do_POST(self):  # noqa: N802
        try:
            if self.path == "/api/clarify":
                data = self._read_json()
                intent = (data.get("intent") or "").strip()
                if not intent:
                    return self._json({"error": "empty"}, 400)
                return self._json(generate.clarify(intent, data.get("profile") or {}))

            if self.path == "/api/generate":
                data = self._read_json()
                intent = (data.get("intent") or "").strip()
                if not intent:
                    return self._json({"error": "empty"}, 400)
                result = generate.script(intent, data.get("profile") or {})
                # 她还在挑卡片，音频已经在合成了
                tts.warm([seg["text"] for s in result["sessions"] for seg in s["segments"]])
                result["tts"] = config.tts_provider()
                for session in result["sessions"]:
                    for seg in session["segments"]:
                        seg["key"] = tts.key_for(seg["text"])
                return self._json(result)

            if self.path == "/api/tts/status":
                data = self._read_json()
                texts = [t for t in (data.get("texts") or []) if isinstance(t, str)]
                return self._json(tts.status_for(texts))

            if self.path == "/api/tts/ensure":
                # 客户端播到某一句还没好 —— 现合成，阻塞返回
                data = self._read_json()
                text = (data.get("text") or "").strip()
                if not text:
                    return self._json({"error": "empty"}, 400)
                path = tts.ensure(text)
                return self._json({"ready": bool(path), "key": tts.key_for(text)})

            return self._json({"error": "not-found"}, 404)

        except Exception:  # noqa: BLE001
            traceback.print_exc()
            return self._json({"error": "server"}, 500)

    def end_headers(self):
        if self.path.endswith((".js", ".css", ".html")) or self.path == "/":
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        # log_error 传进来的第一个参数是 HTTPStatus，不是字符串 —— 直接切片会炸掉整个请求线程
        first = str(args[0]) if args else ""
        if "/api/" in first or fmt.startswith("code "):
            super().log_message(fmt, *args)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8471)
    args = parser.parse_args()

    state = config.status()
    print("  Wren  ·  http://localhost:%d" % args.port)
    print("  稿子   %s%s" % (state["script"], "（%s）" % state["model"] if state["model"] else ""))
    print("  声音   %s%s" % (state["tts"], "（%s）" % state["voice"] if state["voice"] else ""))
    if state["script"] == "template" or state["tts"] == "browser":
        print("  ↳ 填 .env 里的 key 就换成真的，前端不用改")
    print()

    ThreadingHTTPServer(("", args.port), Handler).serve_forever()


if __name__ == "__main__":
    main()
