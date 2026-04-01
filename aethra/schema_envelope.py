"""Internal reference model — external contract via public_output.ensure_public_shape."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class AethraPublicSpec(BaseModel):
    """Canonical client contract."""

    decision: dict[str, Any] = Field(default_factory=dict)
    strategy: dict[str, Any] = Field(default_factory=dict)
    monetisation: dict[str, Any] = Field(default_factory=dict)
    brand: dict[str, Any] = Field(default_factory=dict)
    execution: dict[str, Any] = Field(default_factory=dict)
    portfolio: dict[str, Any] = Field(default_factory=dict)
    meta: dict[str, Any] = Field(default_factory=dict)
    delivery: dict[str, Any] = Field(default_factory=dict)
    marketing: dict[str, Any] = Field(default_factory=dict)
    autonomous: dict[str, Any] = Field(default_factory=dict)
    testing: dict[str, Any] = Field(default_factory=dict)

    def to_json_dict(self) -> dict[str, Any]:
        return self.model_dump(mode="python")


# Legacy name retained for imports; prefer AethraPublicSpec for new code.
AethraEnvelope = AethraPublicSpec
