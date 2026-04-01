/**
 * Ω v15 — Produce human-readable protocol docs from schema.
 */

export function renderDocumentation(schema: {
  name: string;
  version: string;
  fields: Record<string, string>;
}) {
  const lines = [
    `# ${schema.name} (v${schema.version})`,
    "",
    "## Fields",
    ...Object.entries(schema.fields).map(([k, v]) => `- **${k}**: \`${v}\``),
  ];
  return lines.join("\n");
}
