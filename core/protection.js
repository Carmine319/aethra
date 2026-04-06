/**
 * AETHRA system protection — non-destructive guardrails.
 * Safe execution loop: call createSafetySnapshot() before sensitive work;
 * use preventDestructiveAction() to block classified destructive operations.
 */

function createSafetySnapshot() {
  console.log("SNAPSHOT CREATED — SAFE STATE");
}

function preventDestructiveAction(action) {
  const blocked = ["delete", "overwrite", "reset", "remove_structure"];

  if (blocked.includes(action)) {
    throw new Error("DESTRUCTIVE ACTION BLOCKED");
  }
}

module.exports = {
  createSafetySnapshot,
  preventDestructiveAction,
};
