"""Lightweight append-only memory: aethra_memory/memory.json (max 100 runs, deduped)."""

from __future__ import annotations

import json
import os
import time
from typing import Any

_MAX_RUNS = 100


def light_memory_file() -> str:
    if p := os.environ.get("AETHRA_LIGHT_MEMORY_FILE"):
        return p
    return os.path.join(os.getcwd(), "aethra_memory", "memory.json")


def _derive_outcome(dec: dict[str, Any]) -> str:
    if dec.get("build_recommended"):
        return "build"
    if str(dec.get("verdict") or "").lower() == "kill":
        return "kill"
    return "hold"


def _viability_float(dec: dict[str, Any], val: dict[str, Any]) -> float:
    vs = val.get("viability_score")
    if vs is not None:
        try:
            x = float(vs)
            return max(0.0, min(1.0, x))
        except (TypeError, ValueError):
            pass
    scores = dec.get("scores") if isinstance(dec.get("scores"), dict) else {}
    v100 = scores.get("viability_0_100")
    if v100 is not None:
        try:
            return max(0.0, min(1.0, int(v100) / 100.0))
        except (TypeError, ValueError):
            pass
    return 0.0


def _selected_strategy_from_result(result: dict[str, Any]) -> str:
    strat = result.get("strategy") or {}
    eng = strat.get("strategic_engine") if isinstance(strat.get("strategic_engine"), dict) else {}
    sel = eng.get("selected") if isinstance(eng.get("selected"), dict) else {}
    return str(sel.get("name") or sel.get("id") or "").strip()


def _idea_text(dec: dict[str, Any], val: dict[str, Any]) -> str:
    slots = val.get("slots") if isinstance(val.get("slots"), dict) else {}
    if slots.get("raw_idea"):
        return str(slots["raw_idea"])[:500]
    stub = val.get("synthetic_idea_stub_for_engines")
    if isinstance(stub, dict):
        ss = stub.get("slots") if isinstance(stub.get("slots"), dict) else {}
        t = str(ss.get("raw_idea") or ss.get("product_hypothesis") or "").strip()
        if t:
            return t[:500]
    ing = val.get("ingestion") if isinstance(val.get("ingestion"), dict) else {}
    if ing.get("url"):
        return f"{ing.get('url', '')} {ing.get('title', '')}".strip()[:500]
    opps = dec.get("opportunities") if isinstance(dec.get("opportunities"), list) else []
    if opps:
        return str((opps[0] or {}).get("title") or (opps[0] or {}).get("gap_hypothesis") or "miae_scan")[:500]
    return str(dec.get("executive_summary") or "run")[:500]


def _selected_niche(val: dict[str, Any]) -> str:
    return str(val.get("selected_niche") or "").strip()


def _blocked_reasons(dec: dict[str, Any]) -> list[str]:
    br = dec.get("blocked_reasons") if isinstance(dec.get("blocked_reasons"), list) else []
    out = [str(b).strip() for b in br if str(b).strip()]
    return out[:12]


def _extract_row(result: dict[str, Any]) -> dict[str, Any]:
    dec = result.get("decision") or {}
    val = dec.get("validation") if isinstance(dec.get("validation"), dict) else {}

    return {
        "ts_ms": int(time.time() * 1000),
        "idea": _idea_text(dec, val),
        "viability_score": round(_viability_float(dec, val), 4),
        "selected_niche": _selected_niche(val),
        "selected_strategy": _selected_strategy_from_result(result),
        "outcome": _derive_outcome(dec),
        "blocked_reasons": _blocked_reasons(dec),
    }


def _outcome_from_row(row: dict[str, Any]) -> str:
    o = str(row.get("outcome") or "").lower().strip()
    if o in ("build", "kill", "hold"):
        return o
    return _derive_outcome(row.get("decision") if isinstance(row.get("decision"), dict) else {})


def _viability_from_row(row: dict[str, Any]) -> float:
    vs = row.get("viability_score")
    if vs is not None:
        try:
            x = float(vs)
            if x > 1.0:
                return max(0.0, min(1.0, x / 100.0))
            return max(0.0, min(1.0, x))
        except (TypeError, ValueError):
            pass
    sc = row.get("scores") if isinstance(row.get("scores"), dict) else {}
    v100 = sc.get("viability_0_100")
    if v100 is not None:
        try:
            return max(0.0, min(1.0, int(v100) / 100.0))
        except (TypeError, ValueError):
            pass
    return 0.0


def memory_row_blocked_reasons(row: dict[str, Any]) -> list[str]:
    if isinstance(row.get("blocked_reasons"), list):
        return [str(b).strip() for b in row["blocked_reasons"] if str(b).strip()]
    dec = row.get("decision") if isinstance(row.get("decision"), dict) else {}
    br = dec.get("blocked_reasons") if isinstance(dec.get("blocked_reasons"), list) else []
    return [str(b).strip() for b in br if str(b).strip()]


def memory_row_build_recommended(row: dict[str, Any]) -> bool:
    o = str(row.get("outcome") or "").lower().strip()
    if o == "build":
        return True
    if o in ("kill", "hold"):
        return False
    dec = row.get("decision") if isinstance(row.get("decision"), dict) else {}
    return bool(dec.get("build_recommended"))


def memory_row_viability_0_100(row: dict[str, Any]) -> int:
    return int(round(_viability_from_row(row) * 100))


def memory_row_outcome_tag(row: dict[str, Any]) -> str:
    o = str(row.get("outcome") or "").lower().strip()
    if o == "build":
        return "build"
    if o == "kill":
        return "kill"
    if o == "hold":
        return "hold"
    dec = row.get("decision") if isinstance(row.get("decision"), dict) else {}
    if dec.get("build_recommended"):
        return "build"
    return str(dec.get("verdict") or "hold").lower()


def _fingerprint(row: dict[str, Any]) -> tuple[Any, ...]:
    if not isinstance(row, dict):
        return ("", 0.0, "", "", "")
    idea = (row.get("idea") or "").strip().lower()[:500]
    vs = round(_viability_from_row(row), 4)
    niche = (row.get("selected_niche") or "").strip().lower()
    strat = (row.get("selected_strategy") or "").strip().lower()
    outcome = _outcome_from_row(row)
    return (idea, vs, niche, strat, outcome)


def loadMemory() -> list[dict[str, Any]]:
    path = light_memory_file()
    if not os.path.isfile(path):
        return []
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    runs = data.get("runs") if isinstance(data, dict) else None
    if not isinstance(runs, list):
        return []
    return [r for r in runs if isinstance(r, dict)]


def saveMemory(result: dict[str, Any]) -> None:
    path = light_memory_file()
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    row = _extract_row(result)
    fp_new = _fingerprint(row)
    runs = loadMemory()
    for existing in runs:
        if _fingerprint(existing) == fp_new:
            return
    runs.append(row)
    if len(runs) > _MAX_RUNS:
        runs = runs[-_MAX_RUNS:]
    payload = {"runs": runs}
    raw = json.dumps(payload, ensure_ascii=True, separators=(",", ":"))
    d = os.path.dirname(path) or "."
    tmp = os.path.join(d, ".memory.json.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(raw)
    os.replace(tmp, path)
