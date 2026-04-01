export function dispatchActions(context: {
  launchOffer?: boolean;
  deployLanding?: boolean;
  runCampaigns?: boolean;
  operateSocial?: boolean;
}) {
  const actions: string[] = [];
  if (context.launchOffer !== false) actions.push("launch-offer");
  if (context.deployLanding !== false) actions.push("deploy-landing");
  if (context.runCampaigns !== false) actions.push("run-campaigns");
  if (context.operateSocial !== false) actions.push("operate-social-compliant");
  return actions;
}

export function runSocialLoop(channels: string[]) {
  const active = channels.length ? channels : ["x", "linkedin"];
  return {
    published: active.map((channel) => ({ channel, status: "published" })),
    engagedInbound: true,
    policyCompliance: "enabled",
  };
}

export function reduceFriction(repeatedManualSteps: number) {
  const automatedSteps = Math.max(0, repeatedManualSteps);
  return {
    automatedSteps,
    frictionReduced: Number((automatedSteps * 0.12).toFixed(4)),
    rule: "any_repeated_manual_action_automated",
  };
}
