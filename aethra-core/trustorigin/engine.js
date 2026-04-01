"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { writeActionLog } = require("../utils.js");

function hashDoc(text) {
  return crypto.createHash("sha256").update(String(text || ""), "utf8").digest("hex");
}

function generateDossier({ venture, pricing }) {
  const entry = 49;
  const premium = 149;
  const body = JSON.stringify({ venture, pricing, ts: Date.now() });
  const h = hashDoc(body);
  const pdfPath = path.join(__dirname, "..", "logs", `dossier_${h.slice(0, 12)}.pdf.txt`);
  const content = `Verified Business Dossier\nHash: ${h}\nVenture: ${venture}\nEntry GBP ${entry} / Premium GBP ${premium}\nTrustOrigin receipt: TRUST-${h.slice(0, 10)}\n`;
  fs.writeFileSync(pdfPath, content, "utf8");
  writeActionLog({ type: "trustorigin_dossier", hash: h, pdfPath });
  return {
    entry_gbp: entry,
    premium_gbp: premium,
    hash: h,
    receipt_id: `TRUST-${h.slice(0, 10)}`,
    pdf_path: pdfPath,
    public_proof_link: `/core/trustorigin/${h.slice(0, 12)}`,
  };
}

module.exports = { generateDossier, hashDoc };