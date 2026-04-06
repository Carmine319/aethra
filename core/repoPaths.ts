import * as path from "path";

/** Repo root when running from compiled `core/dist-cjs/*.js`. */
export function getRepoRoot(): string {
  return path.resolve(__dirname, "..", "..");
}
