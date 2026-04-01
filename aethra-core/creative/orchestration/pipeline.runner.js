"use strict";

const { generateBrand } = require("../brand/brand.engine.js");
const { generateLanding } = require("../landing/landing.engine.js");
const { generateContent } = require("../content/content.engine.js");
const { generateVideo } = require("../media/video.engine.js");
const { distribute } = require("../content/distribution.engine.js");
const { attachMonetisation } = require("../monetisation.bridge.js");
const { selectBestTool } = require("./tool.router.js");

async function runCreativePipeline(opportunity) {
  const input = opportunity && typeof opportunity === "object" ? opportunity : {};
  const tools = {
    brand: selectBestTool({ type: "brand", minQuality: 6 }).name,
    landing: selectBestTool({ type: "landing", minQuality: 7 }).name,
    content: selectBestTool({ type: "content", minQuality: 6 }).name,
    video: selectBestTool({ type: "video", minQuality: 7 }).name,
  };
  const brand = generateBrand(input);
  const landing = generateLanding({ ...input, targetAudience: brand.targetAudience });
  const monetisedLanding = attachMonetisation(landing, {
    name: String(input.name || input.idea || "Aethra Offer"),
    price: Number(input.price || 499),
    stripeCheckoutUrl: String(input.stripeCheckoutUrl || ""),
  });
  const content = generateContent({
    ...input,
    targetAudience: brand.targetAudience,
    checkoutLink: monetisedLanding.checkoutLink,
  });
  const video = generateVideo({
    ...input,
    targetAudience: brand.targetAudience,
    checkoutLink: monetisedLanding.checkoutLink,
  });
  const distribution = await distribute(content);
  return { tools, brand, landing: monetisedLanding, content, video, distribution };
}

module.exports = { runCreativePipeline };
