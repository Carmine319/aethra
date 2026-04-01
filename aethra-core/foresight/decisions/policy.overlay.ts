export function overlayExternalPolicy(context: { attributed?: boolean; channelCount?: number }) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ext = require("../../external/compliance/policy.enforcer");
    ext.assertExternalPolicies(context);
  } catch {
    /* Ω v10 external layer optional if not bundled */
  }
}
