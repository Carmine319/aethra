export function extractPatterns(memory: any[]) {
  return (memory || []).slice(-10);
}
