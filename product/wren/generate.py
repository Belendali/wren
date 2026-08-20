"""写稿：有 key 就走 Claude，没 key 就走本地模板。

两条路返回的结构完全一样，前端不需要知道走的是哪条 —— 这样后填 key
的那一天不用改任何前端代码。
"""
from __future__ import annotations

import datetime
import json
import re
import sys

from . import config, prompts

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
ARTS = ["coral", "sage", "blue"]

# 说得慢。冥想引导大约 110 wpm，段间静默另算。
WORDS_PER_MINUTE = 110


def _now():
    now = datetime.datetime.now()
    hour = now.hour
    part = "morning" if hour < 12 else "afternoon" if hour < 18 else "evening"
    return DAYS[now.weekday()], part


def estimate_seconds(segments) -> int:
    words = sum(len(s.get("text", "").split()) for s in segments)
    pauses = sum(float(s.get("pause") or 0) for s in segments)
    return int(round(words / WORDS_PER_MINUTE * 60 + pauses))


def _label(seconds: int) -> str:
    if seconds < 105:
        return "90 sec"
    return "%d min" % max(1, int(round(seconds / 60.0)))


def _shape(sessions) -> list:
    """统一补齐前端要的字段。两条生成路径共用。"""
    out = []
    for i, s in enumerate(sessions[:3]):
        segments = [
            {
                "text": (seg.get("text") or "").strip(),
                "pause": max(0.4, min(6.0, float(seg.get("pause") or 1.2))),
                "bird": bool(seg.get("bird")),
            }
            for seg in s.get("segments", [])
            if (seg.get("text") or "").strip()
        ]
        seconds = estimate_seconds(segments)
        out.append(
            {
                "id": "s%d" % (i + 1),
                "index": i,
                "title": (s.get("title") or "").strip(),
                "openingLine": (s.get("opening_line") or s.get("title") or "").strip(),
                "carry": (s.get("carry") or "").strip(),
                "art": ARTS[i % len(ARTS)],
                "seconds": seconds,
                "label": _label(seconds),
                "segments": segments,
            }
        )
    return out


# ══════════════════════════════════════════════════════
#  Claude
# ══════════════════════════════════════════════════════

_client = None


def _anthropic():
    """延迟建 client —— 没装 SDK 或没填 key 的机器也要能把服务起起来。"""
    global _client
    if _client is not None:
        return _client
    key = config.anthropic_key()
    if not key:
        return None
    try:
        import anthropic
    except ImportError:
        print("[wren] ANTHROPIC_API_KEY 有了，但没装 SDK：pip install -r requirements.txt", file=sys.stderr)
        return None
    _client = anthropic.Anthropic(api_key=key)
    return _client


def _parse(response):
    for block in response.content:
        if block.type == "text":
            return json.loads(block.text)
    raise ValueError("模型没有返回文本块")


def script_with_claude(intent: str, profile: dict) -> list:
    client = _anthropic()
    if client is None:
        raise RuntimeError("no-client")
    day, part = _now()
    response = client.messages.create(
        model=config.anthropic_model(),
        max_tokens=16000,
        system=prompts.SCRIPT_SYSTEM,
        messages=[{"role": "user", "content": prompts.script_user_prompt(intent, profile, day, part)}],
        output_config={"format": {"type": "json_schema", "schema": prompts.SCRIPT_SCHEMA}},
    )
    stop = getattr(response, "stop_reason", None)
    if stop in ("refusal", "max_tokens"):
        raise RuntimeError("stop_reason=%s" % stop)
    sessions = _parse(response)["sessions"]
    if len(sessions) < 3:
        raise RuntimeError("模型只给了 %d 段" % len(sessions))
    return _shape(sessions)


def clarify_with_claude(intent: str, profile: dict) -> dict:
    client = _anthropic()
    if client is None:
        raise RuntimeError("no-client")
    response = client.messages.create(
        model=config.anthropic_model(),
        max_tokens=2000,
        system=prompts.CLARIFY_SYSTEM,
        messages=[{"role": "user", "content": prompts.clarify_user_prompt(intent, profile)}],
        output_config={
            "effort": "low",
            "format": {"type": "json_schema", "schema": prompts.CLARIFY_SCHEMA},
        },
    )
    if getattr(response, "stop_reason", None) == "refusal":
        raise RuntimeError("refusal")
    data = _parse(response)
    return {
        "ok": bool(data.get("specific")),
        "reflection": (data.get("reflection") or "").strip(),
        "options": [o.strip() for o in (data.get("options") or []) if o.strip()][:2],
    }


# ══════════════════════════════════════════════════════
#  兜底模板 —— 没有 key 的时候，流程照样从头走到尾
# ══════════════════════════════════════════════════════

_TIME = re.compile(
    r"\b(today|tonight|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday"
    r"|morning|afternoon|evening|next week|this week|month|year|years|spring|summer|autumn"
    r"|fall|winter|january|february|march|april|may|june|july|august|september|october"
    r"|november|december|\d{1,2}\s?(am|pm))\b",
    re.I,
)
_BEHAVIOUR = re.compile(
    r"\b(say|says|said|speak|speaking|talk|talking|ask|asking|walk|walking|stop|stopping"
    r"|start|starting|leave|leaving|call|calling|tell|telling|send|sending|show up|apolog\w*"
    r"|answer|answering|finish|finishing|present|presentation|hold|holding|put down|pick up"
    r"|sit|stand|breathe|slow down|look up)\b",
    re.I,
)
_SENSORY = re.compile(r"\b(feels?|feeling|sounds?|looks?|smells?|quiet|loud|warm|cold|steady|light|heavy)\b", re.I)
_PLACE = re.compile(r"\b(room|office|kitchen|car|desk|stage|table|door|hallway|stairwell|studio|gym|street|house|home|apartment|flat|bedroom|garden|hall|lobby|clinic|classroom)\b", re.I)
_VAGUE = re.compile(
    r"\b(money|rich|wealth|happy|happiness|better|good|great|confident|confidence|success"
    r"|successful|healthy|health|love|peace|calm|freedom|free|everything|things|life)\b",
    re.I,
)


def clarify_locally(intent: str, profile: dict) -> dict:
    text = (intent or "").strip()
    if not text:
        return {"ok": False, "reflection": "", "options": []}

    names = [p.get("name", "") for p in (profile.get("people") or []) if p.get("name")]
    has_name = any(re.search(r"\b%s\b" % re.escape(n), text, re.I) for n in names)
    has_proper = bool(re.search(r"(?!^)\b[A-Z][a-z]{2,}\b", text.lstrip()))

    anchored = any(
        [
            _TIME.search(text),
            has_name or has_proper,
            _PLACE.search(text),
            _BEHAVIOUR.search(text),
            _SENSORY.search(text),
        ]
    )
    if anchored:
        return {"ok": True, "reflection": "", "options": []}

    low = text.lower()
    options = []
    if re.search(r"money|rich|wealth", low):
        options = ["enough that rent week isn't a week", "leaving without a plan B"]
    elif re.search(r"confiden|brave|nervous|scared", low):
        who = names[0] if names else None
        options = [
            "not apologising before I speak" + (" to %s" % who if who else ""),
            "finishing the sentence I started",
        ]
    elif re.search(r"happy|peace|calm|better", low):
        options = ["a morning that doesn't start behind", "putting the phone face down at dinner"]
    else:
        first = (profile.get("desire") or "").split(",")[0].strip()
        options = [o for o in [first, "one afternoon this week where it's already true"] if o][:2]

    return {
        "ok": False,
        "reflection": "I can carry that.\nIt flies further if I know what it looks like.",
        "options": options[:2],
        "word": (_VAGUE.search(text).group(0) if _VAGUE.search(text) else None),
    }


def _key_phrase(s: str) -> str:
    """在从句边界切，不在第 9 个词切 —— 断口一旦被念出来整段就露馅。"""
    clean = re.sub(r"^(i\s+(want|need|hope|wish)\s+(to\s+)?)", "", (s or "").strip(), flags=re.I)
    clean = re.sub(r"[.!?。]+$", "", clean).strip()
    clause = re.split(r"[,;—]|\s+(?:and|but|because|so)\s+", clean, flags=re.I)[0].strip()
    words = clause.split()
    if 3 <= len(words) <= 14:
        return clause
    if len(words) > 14:
        return " ".join(words[:12])
    allw = clean.split()
    return clean if len(allw) <= 16 else " ".join(allw[:14])


def _carry_line(intent: str) -> str:
    t = (intent or "").lower()
    if re.search(r"apolog", t):
        return "I can start without saying sorry."
    if re.search(r"present|stage|speech|talk|pitch", t):
        return "I walk in already steady."
    if re.search(r"fast|quick|rush", t):
        return "I can take the long way through a sentence."
    if re.search(r"money|rent|house", t):
        return "I am allowed to want the whole amount."
    if re.search(r"\bno\b|boundar", t):
        return "No is a complete sentence."
    if re.search(r"nervous|scared|afraid", t):
        return "Nervous and ready are the same feeling."
    return "I am already the person who does this."


def script_locally(intent: str, profile: dict) -> list:
    name = (profile.get("name") or "").strip()
    you = name if name else "You"
    day, part = _now()
    phrase = _key_phrase(intent)
    anchor = (profile.get("bodyAnchor") or "chest").lower()
    people = [p for p in (profile.get("people") or []) if p.get("name")]
    who = people[0] if people else None
    carry = _carry_line(intent)

    def land():
        s = []
        s.append({"text": "%s." % you, "pause": 1.4, "bird": False})
        s.append({"text": "It's %s %s." % (day, part), "pause": 1.2, "bird": False})
        s.append({"text": "You said: %s." % phrase, "pause": 2.0, "bird": False})
        s.append({"text": "Wren has that. It's already gone up with it.", "pause": 1.8, "bird": True})
        s.append({"text": "Let the next breath out slowly. All of it.", "pause": 3.4, "bird": False})
        return s

    def breathe():
        return [
            {"text": "Breathe in through your nose.", "pause": 3.0, "bird": False},
            {"text": "And out. Longer than you took it in.", "pause": 4.0, "bird": False},
            {"text": "Again. In.", "pause": 3.0, "bird": False},
            {"text": "And out.", "pause": 4.0, "bird": False},
            {"text": "Find your %s. Notice what it's holding without being asked." % anchor, "pause": 3.2, "bird": False},
            {"text": "Let it come down half a centimetre. Not all the way. Just half.", "pause": 3.6, "bird": False},
        ]

    def feel():
        return [
            {"text": "Come back to your %s." % anchor, "pause": 2.4, "bird": False},
            {"text": "This is what it feels like when it's already true.", "pause": 3.0, "bird": False},
            {
                "text": "Mark it. Your body will find it again this afternoon faster than your mind will.",
                "pause": 3.4,
                "bird": False,
            },
        ]

    def close(line):
        return [
            {"text": "One line to take with you.", "pause": 2.0, "bird": False},
            {"text": line, "pause": 3.6, "bird": False},
            {"text": line, "pause": 4.0, "bird": False},
            {"text": "That's it. Wren's already up there with the rest.", "pause": 1.6, "bird": True},
        ]

    cap = phrase[:1].upper() + phrase[1:] if phrase else phrase

    one = land() + breathe() + [
        {"text": "Now go there.", "pause": 2.0, "bird": False},
        {"text": "%s." % cap, "pause": 2.4, "bird": False},
        {"text": "You're already in it. Not walking toward it — in it.", "pause": 2.8, "bird": True},
        {"text": "It's going the way you'd want it to go. Notice you're not surprised.", "pause": 3.2, "bird": False},
    ]
    if who:
        one.append({"text": "%s is there. %s" % (who["name"], who.get("note", "")), "pause": 2.6, "bird": False})
    one += feel() + close(carry)

    two = land() + breathe() + [
        {"text": "Now go back one hour.", "pause": 2.2, "bird": False},
        {"text": "Before any of it starts. The corridor. The car. The last quiet minute.", "pause": 3.0, "bird": True},
        {"text": "Nothing has happened yet, and you're already steady.", "pause": 2.8, "bird": False},
        {"text": "That's the part nobody sees. It's the part that does the work.", "pause": 3.2, "bird": False},
    ] + feel() + close("I get to arrive before it starts.")

    three = [
        {"text": "%s." % you, "pause": 1.4, "bird": False},
        {"text": "Ninety seconds. That's all this is.", "pause": 1.6, "bird": True},
        {"text": "Breathe out first. Longer than feels necessary.", "pause": 4.0, "bird": False},
        {"text": "Now the smallest version of it.", "pause": 2.2, "bird": False},
        {"text": "Not the whole thing. One sentence you finish without speeding up.", "pause": 3.0, "bird": False},
        {"text": "One pause you let sit there without filling it.", "pause": 3.4, "bird": False},
        {"text": "You can do that this afternoon. It doesn't need an occasion.", "pause": 2.8, "bird": False},
    ] + close("I can do the small version today.")

    return _shape(
        [
            {"title": carry.rstrip("."), "opening_line": cap or carry, "carry": carry, "segments": one},
            {
                "title": "I arrive before it starts",
                "opening_line": "The hour before it, and I'm already steady",
                "carry": "I get to arrive before it starts.",
                "segments": two,
            },
            {
                "title": "I let the pause sit there",
                "opening_line": "One sentence I finish without speeding up",
                "carry": "I can do the small version today.",
                "segments": three,
            },
        ]
    )


# ══════════════════════════════════════════════════════
#  入口
# ══════════════════════════════════════════════════════


def clarify(intent: str, profile: dict) -> dict:
    if config.anthropic_key():
        try:
            result = clarify_with_claude(intent, profile)
            result["source"] = "claude"
            return result
        except Exception as exc:  # noqa: BLE001 — 任何失败都不该挡住她说话
            print("[wren] clarify 回退到本地：%s" % exc, file=sys.stderr)
    result = clarify_locally(intent, profile)
    result["source"] = "template"
    return result


def script(intent: str, profile: dict) -> dict:
    if config.anthropic_key():
        try:
            return {"sessions": script_with_claude(intent, profile), "source": "claude"}
        except Exception as exc:  # noqa: BLE001
            print("[wren] 生成回退到本地模板：%s" % exc, file=sys.stderr)
    return {"sessions": script_locally(intent, profile), "source": "template"}


# ══════════════════════════════════════════════════════
#  每日推荐 —— 她还没开口之前，Wren 先带回来的三段
# ══════════════════════════════════════════════════════


def daily_with_claude(profile: dict) -> dict:
    client = _anthropic()
    if client is None:
        raise RuntimeError("no-client")
    day, part = _now()
    response = client.messages.create(
        model=config.anthropic_model(),
        max_tokens=16000,
        system=prompts.DAILY_SYSTEM + "\n\n" + prompts.SCRIPT_SYSTEM,
        messages=[{"role": "user", "content": prompts.daily_user_prompt(profile, day, part)}],
        output_config={"format": {"type": "json_schema", "schema": prompts.DAILY_SCHEMA}},
    )
    stop = getattr(response, "stop_reason", None)
    if stop in ("refusal", "max_tokens"):
        raise RuntimeError("stop_reason=%s" % stop)
    data = _parse(response)
    if len(data.get("sessions") or []) < 3:
        raise RuntimeError("模型只给了 %d 段" % len(data.get("sessions") or []))
    return {
        "sessions": _shape(data["sessions"]),
        "suggestions": [s.strip() for s in (data.get("suggestions") or []) if s.strip()][:2],
    }


# 从她描述的那段生活里抠出短句，当输入框下面的快捷入口
_WISH = re.compile(
    r"\b(?:i\s+(?:want|wish|hope|dream|would love)\s+(?:to\s+|for\s+)?)(.{3,42}?)(?=[,.;]|\s+and\s+|\s+but\s+|$)",
    re.I,
)


def _suggestions_from(profile: dict) -> list:
    # 用句号拼，不是空格 —— 不然「…at Google I want to stop…」连成一句，
    # 正则找不到子句边界，前一条就被整个吞掉了
    parts = [str(profile.get(k) or "").strip().rstrip(".") for k in ("dream", "desire")]
    text = ". ".join(p for p in parts if p) + "."
    out = []
    for m in _WISH.finditer(text):
        phrase = m.group(1).strip().rstrip(".")
        if 3 <= len(phrase) <= 42:
            out.append(phrase[0].upper() + phrase[1:])
    # 名词短语兜底：抓「a big house with a garden」这类
    if len(out) < 2:
        for m in re.finditer(r"\b(?:a|an|my)\s+([a-z]+(?:\s+[a-z]+){1,3})\b", text, re.I):
            phrase = m.group(0).strip()
            if phrase.lower() not in (x.lower() for x in out):
                out.append(phrase[0].upper() + phrase[1:])
            if len(out) >= 2:
                break

    # 收尾：别停在介词或连词上（「A big beautiful house with」这种读着像半句话）
    dangling = {"with", "and", "of", "in", "for", "to", "that", "a", "an", "the", "my", "at", "on"}
    cleaned = []
    for phrase in out:
        words = phrase.split()
        while words and words[-1].lower() in dangling:
            words.pop()
        if len(words) < 2:
            continue
        phrase = " ".join(words)
        low = phrase.lower()
        # 「Get my dream job at Google」和「My dream job at Google」只留一条
        if any(low in c.lower() or c.lower() in low for c in cleaned):
            continue
        cleaned.append(phrase)
    return cleaned[:2]


def daily_locally(profile: dict) -> dict:
    """没有 key 时的每日三段。用她描述的那段生活当素材，走同一套五段式。"""
    dream = (profile.get("dream") or profile.get("desire") or "").strip()
    seeds = [
        dream or "a morning that starts the way you want it to",
        "the hour before anyone needs anything from you",
        "one ordinary afternoon inside it",
    ]
    titles = ["The morning inside it", "Before anyone's up", "An ordinary afternoon"]

    sessions = []
    for i, seed in enumerate(seeds):
        built = script_locally(seed, profile)[0 if i < 2 else 2]
        built["title"] = titles[i]
        built["openingLine"] = built["openingLine"] or titles[i]
        sessions.append(built)
    # 重新编号，免得三段都叫 s1
    for i, s in enumerate(sessions):
        s["id"] = "s%d" % (i + 1)
        s["index"] = i
        s["art"] = ARTS[i % len(ARTS)]
    return {"sessions": sessions, "suggestions": _suggestions_from(profile)}


def daily(profile: dict) -> dict:
    if config.anthropic_key():
        try:
            result = daily_with_claude(profile)
            result["source"] = "claude"
            return result
        except Exception as exc:  # noqa: BLE001
            print("[wren] 每日推荐回退到本地模板：%s" % exc, file=sys.stderr)
    result = daily_locally(profile)
    result["source"] = "template"
    return result
