export function validateSession(sessionId: string) {
  if (!sessionId || sessionId.length < 5) {
    throw new Error("Invalid session ID");
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(sessionId)) {
    throw new Error("Session ID contains restricted characters");
  }
}
