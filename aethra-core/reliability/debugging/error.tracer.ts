export function traceError(error: { message: string; module?: string; stack?: string }) {
  return {
    origin: String(error.module || "unknown-module"),
    impact: error.message.includes("payment") ? "revenue-critical" : "operational",
    affectedModules: [String(error.module || "unknown-module")],
    message: error.message,
  };
}
