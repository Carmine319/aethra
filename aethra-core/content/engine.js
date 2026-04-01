"use strict";

const fs = require("fs");
const path = require("path");
const { writeActionLog } = require("../utils.js");

function generateDailyContent() {
  const topics = [
    "I built a business in 24h with AI",
    "This system replaced my job",
    "From GBP 0 to GBP X using automation",
    "Kill bad ideas fast",
  ];

  const short = [
    { platform: "linkedin", text: `Built and validated a venture in 24h. Framework: niche -> offer -> leads -> outreach -> close. ${topics[0]}` },
    { platform: "reddit", text: `If your side hustle is stuck, run fast validation then kill weak ideas early. ${topics[3]}` },
    { platform: "x", text: `Revenue loop today: content -> leads -> outreach -> conversion. ${topics[2]}` },
  ];

  const long = {
    platform: "linkedin_blog",
    title: "How AETHRA turns ideas into revenue loops",
    text: `${topics[0]}. ${topics[1]}. Core mechanic: generate demand, test quickly, monetize entry offer, and iterate daily.`
  };

  const video_script = `Hook: ${topics[0]}\nProblem: Most people overbuild and never sell.\nSystem: AETHRA sources leads, runs outreach, and converts with low-friction offers.\nProof: ${topics[2]}\nCTA: Start Building Now.`;

  const out = { short_form_posts: short, long_form_post: long, video_script, topics };
  writeActionLog({ type: "content_daily", out });
  return out;
}

function generateVideoFromScript(script) {
  const s = String(script || "").trim();
  const outPath = path.join(__dirname, "..", "logs", `video_${Date.now()}.json`);
  const render = {
    provider: "heygen_or_equivalent_wrapper",
    format: "vertical_9_16",
    captions_embedded: true,
    cta: "Start Building Now",
    script: s,
    status: "queued",
  };
  fs.writeFileSync(outPath, JSON.stringify(render, null, 2), "utf8");
  writeActionLog({ type: "video_generate", render_file: outPath });
  return render;
}

module.exports = { generateDailyContent, generateVideoFromScript };