"""CLI entry — structured JSON to stdout."""

from __future__ import annotations

import argparse
import json
import os
import sys

from aethra.orchestrator import dump_json, run_idea, run_miae_standalone, run_url
from aethra.output_formatter import format_cli_output


def _ensure_utf8_stdio() -> None:
    """Avoid UnicodeEncodeError on Windows (cp1252) when printing emoji in the executive brief."""
    for stream in (sys.stdout, sys.stderr):
        try:
            if hasattr(stream, "reconfigure"):
                stream.reconfigure(encoding="utf-8", errors="replace")
        except (OSError, ValueError, AttributeError):
            pass


def _load_context(path: str | None) -> dict:
    if not path:
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _stdio_dispatch(data: dict) -> dict:
    cmd = str(data.get("cmd") or "").strip().lower()
    ctx = data.get("context") if isinstance(data.get("context"), dict) else {}
    no_cache = bool(data.get("noCache") or data.get("no_cache"))
    if cmd == "idea":
        text = str(data.get("text") or "").strip()
        if not text:
            return {"error": "missing_text", "ok": False}
        return run_idea(text, ctx, use_cache=not no_cache)
    if cmd == "url":
        url = str(data.get("url") or "").strip()
        if not url:
            return {"error": "missing_url", "ok": False}
        return run_url(url, ctx, use_cache=not no_cache)
    if cmd == "miae":
        return run_miae_standalone(ctx)
    return {"error": "unknown_cmd", "ok": False, "allowed": ["idea", "url", "miae"]}


def stdio_main() -> None:
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        sys.stdout.write(dump_json({"ok": False, "error": "invalid_json", "detail": str(e)}) + "\n")
        sys.exit(1)
    out = _stdio_dispatch(data)
    sys.stdout.write(dump_json(out) + "\n")


def main() -> None:
    _ensure_utf8_stdio()
    p = argparse.ArgumentParser(prog="aethra", description="AETHRA Q+++")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("stdio", help="Read one JSON object from stdin; write JSON result (for Node host)")

    pi = sub.add_parser("idea", help="IDEA MODE pipeline")
    pi.add_argument("text", help='Idea text, e.g. \'Validate idea: ...\'')
    pi.add_argument("--context", "-c", help="JSON file with optional assumed_margin_pct, launch_days_estimate, etc.")
    pi.add_argument("--no-cache", action="store_true")
    pi.add_argument(
        "--plain-json",
        action="store_true",
        help="Emit JSON only (no summary). stdio always uses this.",
    )

    pu = sub.add_parser("url", help="URL MODE pipeline")
    pu.add_argument("url")
    pu.add_argument("--context", "-c", help="Optional JSON context file")
    pu.add_argument("--no-cache", action="store_true")
    pu.add_argument("--plain-json", action="store_true", help="Emit JSON only (no summary).")

    pm = sub.add_parser("miae", help="Market Intelligence scan (needs trend_summaries in context)")
    pm.add_argument("--context", "-c", help="JSON file with trend_summaries list")
    pm.add_argument("--plain-json", action="store_true", help="Emit JSON only (no summary).")

    sub.add_parser("schema", help="Print OpenAPI-style JSON schema for UI clients")

    args = p.parse_args()

    if args.cmd == "stdio":
        stdio_main()
        return

    if args.cmd == "schema":
        from aethra.api_schema import openapi_style_schema

        sys.stdout.write(dump_json(openapi_style_schema()) + "\n")
        return

    ctx = _load_context(getattr(args, "context", None))

    if args.cmd == "idea":
        out = run_idea(args.text, ctx, use_cache=not args.no_cache)
    elif args.cmd == "url":
        out = run_url(args.url, ctx, use_cache=not args.no_cache)
    else:
        out = run_miae_standalone(ctx)

    plain = bool(getattr(args, "plain_json", False)) or os.environ.get("AETHRA_PLAIN_JSON", "").strip() in (
        "1",
        "true",
        "yes",
    )
    if plain:
        sys.stdout.write(dump_json(out) + "\n")
    else:
        sys.stdout.write(format_cli_output(out))


if __name__ == "__main__":
    main()
