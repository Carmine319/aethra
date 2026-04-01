export function rankSectionsByPerformance(
  sections: string[],
  behaviouralData: Array<Record<string, unknown>>
): string[] {
  const rows = Array.isArray(behaviouralData) ? behaviouralData : [];
  const score = (section: string) => {
    const s = rows.filter((r) => String(r.section || "").toLowerCase() === section.toLowerCase());
    const conversions = s.reduce((a, r) => a + (Number(r.converted || 0) > 0 ? 1 : 0), 0);
    const views = Math.max(1, s.length);
    return conversions / views;
  };
  return [...sections].sort((a, b) => score(b) - score(a));
}
