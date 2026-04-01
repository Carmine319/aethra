import { generateBrand } from "../brand/brand.engine";
import { generateLanding } from "../landing/landing.engine";
import { generateContent } from "../content/content.engine";
import { generateVideo } from "../media/video.engine";
import { distribute } from "../content/distribution.engine";
import { attachMonetisation } from "../monetisation.bridge";
import { selectBestTool } from "./tool.router";

export async function runCreativePipeline(opportunity: Record<string, unknown>) {
  const tools = {
    brand: selectBestTool({ type: "brand", minQuality: 6 }).name,
    landing: selectBestTool({ type: "landing", minQuality: 7 }).name,
    content: selectBestTool({ type: "content", minQuality: 6 }).name,
    video: selectBestTool({ type: "video", minQuality: 7 }).name,
  };
  const brand = generateBrand(opportunity);
  const landing = generateLanding({ ...opportunity, targetAudience: brand.targetAudience });
  const monetisedLanding = attachMonetisation(landing, {
    name: String(opportunity.name || opportunity.idea || "Aethra Offer"),
    price: Number(opportunity.price || 499),
    stripeCheckoutUrl: String(opportunity.stripeCheckoutUrl || ""),
  });
  const content = generateContent({
    ...opportunity,
    targetAudience: brand.targetAudience,
    checkoutLink: monetisedLanding.checkoutLink,
  });
  const video = generateVideo({
    ...opportunity,
    targetAudience: brand.targetAudience,
    checkoutLink: monetisedLanding.checkoutLink,
  });
  const distribution = await distribute(content);

  return {
    tools,
    brand,
    landing: monetisedLanding,
    content,
    video,
    distribution,
  };
}
