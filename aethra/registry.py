"""Canonical module registry — single responsibility map (anti-drift reference)."""

MODULES: list[dict[str, str]] = [
    {"id": "MIAE", "module": "aethra.engines.miae", "role": "market_intelligence_allocation"},
    {"id": "IDEA", "module": "aethra.engines.idea", "role": "idea_validation"},
    {"id": "INGEST", "module": "aethra.engines.ingestion", "role": "url_ingest_trim"},
    {"id": "ANALYSIS", "module": "aethra.engines.analysis", "role": "page_analysis"},
    {"id": "SIE", "module": "aethra.engines.sie", "role": "strategic_intelligence"},
    {"id": "PEX", "module": "aethra.engines.pex", "role": "predictive_execution"},
    {"id": "MON", "module": "aethra.engines.monetisation", "role": "monetisation"},
    {"id": "ABGE", "module": "aethra.engines.abge", "role": "brand_growth"},
    {"id": "IEPE", "module": "aethra.engines.iepe", "role": "industrial_execution_profit"},
    {"id": "PCS", "module": "aethra.engines.pcs", "role": "portfolio_control"},
    {"id": "MIGE", "module": "aethra.engines.mige", "role": "meta_governance"},
    {"id": "NEMDE", "module": "aethra.engines.nemde", "role": "network_memory"},
    {"id": "MIEAE", "module": "aethra.engines.mieae", "role": "macro_intelligence"},
]

CONTROL_LAYERS: list[dict[str, str]] = [
    {"layer": 1, "module": "aethra.control.intent", "name": "intent_lock"},
    {"layer": 2, "module": "aethra.control.opportunity_filter", "name": "opportunity_filter"},
    {"layer": 3, "module": "aethra.control.market_reality", "name": "market_reality"},
    {"layer": 4, "module": "aethra.control.control_plane", "name": "control_plane"},
]

MEMORY_MODULES: list[dict[str, str]] = [
    {"id": "MEM_LIGHT", "module": "aethra.memory.light", "role": "append_only_json"},
    {"id": "MEM_SIM", "module": "aethra.memory.similarity", "role": "idea_similarity"},
    {"id": "MEM_PAT", "module": "aethra.memory.patterns", "role": "pattern_recognition"},
    {"id": "MEM_STORE", "module": "aethra.memory.store", "role": "versioned_audit"},
]

OUTPUT_LAYERS: list[dict[str, str]] = [
    {"module": "aethra.signal_compress", "name": "presentation_signal_compress"},
    {"module": "aethra.output_formatter", "name": "cli_human_summary"},
    {"module": "aethra.public_output", "name": "eleven_key_envelope"},
    {"module": "aethra.api_schema", "name": "api_contract"},
]
