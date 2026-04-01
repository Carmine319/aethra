"""Machine-readable API contract for web and integration clients."""

from __future__ import annotations

API_VERSION = "1.0.0"
CONTRACT = "eleven_key"
PUBLIC_KEYS = [
    "decision",
    "strategy",
    "monetisation",
    "brand",
    "execution",
    "portfolio",
    "meta",
    "delivery",
    "marketing",
    "autonomous",
    "testing",
]


def meta_api_block() -> dict:
    return {
        "api_version": API_VERSION,
        "contract": CONTRACT,
        "public_keys": PUBLIC_KEYS,
        "endpoints": {
            "health": "GET /health",
            "schema": "GET /api/v1/schema",
            "idea": "POST /api/v1/idea",
            "url": "POST /api/v1/url",
            "miae": "POST /api/v1/miae",
            "run": "POST /api/v1/run",
        },
    }


def openapi_style_schema() -> dict:
    return {
        "openapi": "3.0.3",
        "info": {"title": "AETHRA Q+++", "version": API_VERSION},
        "paths": {
            "/health": {"get": {"summary": "Liveness"}},
            "/api/v1/schema": {"get": {"summary": "This document (JSON)"}},
            "/api/v1/idea": {
                "post": {
                    "summary": "Full IDEA pipeline",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "required": ["text"],
                                    "properties": {
                                        "text": {"type": "string"},
                                        "context": {"type": "object"},
                                        "noCache": {"type": "boolean"},
                                    },
                                }
                            }
                        }
                    },
                }
            },
            "/api/v1/url": {
                "post": {
                    "summary": "URL audit pipeline",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "required": ["url"],
                                    "properties": {
                                        "url": {"type": "string"},
                                        "context": {"type": "object"},
                                        "noCache": {"type": "boolean"},
                                    },
                                }
                            }
                        }
                    },
                }
            },
            "/api/v1/miae": {
                "post": {
                    "summary": "Market intelligence (top 3)",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {"context": {"type": "object"}},
                                }
                            }
                        }
                    },
                }
            },
            "/api/v1/run": {
                "post": {
                    "summary": "Unified runner",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "required": ["mode"],
                                    "properties": {
                                        "mode": {"enum": ["idea", "url", "miae"]},
                                        "text": {"type": "string"},
                                        "url": {"type": "string"},
                                        "context": {"type": "object"},
                                        "noCache": {"type": "boolean"},
                                    },
                                }
                            }
                        }
                    },
                }
            },
        },
    }
