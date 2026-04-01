import fs from "fs";
import path from "path";

function readPolicy(): { legal_entity_default: string } {
  const file = path.join(__dirname, "..", "policies", "external.policy.json");
  if (!fs.existsSync(file)) return { legal_entity_default: "Oriagen AI Ltd" };
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function resolveLegalEntity(): string {
  return (
    process.env.AETHRA_LEGAL_ENTITY ||
    process.env.ORIAGEN_LEGAL_ENTITY ||
    readPolicy().legal_entity_default ||
    "Oriagen AI Ltd"
  );
}

export function mapActionToIdentity(action: Record<string, unknown>) {
  return {
    ...action,
    legal_entity: resolveLegalEntity(),
    attribution_required: true,
  };
}
