"use strict";

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "invoices_ledger.json");

function readLedger() {
  try {
    const j = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return Array.isArray(j.invoices) ? j.invoices : [];
  } catch {
    return [];
  }
}

function writeLedger(invoices) {
  try {
    fs.writeFileSync(FILE, JSON.stringify({ invoices }, null, 2), "utf8");
  } catch {
    /* optional persistence */
  }
}

let idSeq = Date.now() % 100000;

/**
 * Append-only invoice record (trust surface — no fake paid status unless set explicitly).
 */
function generateInvoice(client, service, price, status = "draft") {
  const cn = String(client || "").trim() || "Client";
  const sv = String(service || "").trim() || "Service";
  const amount = Math.round(Number(price) * 100) / 100;
  const invoice_id = `AETH-${++idSeq}`;
  const row = {
    invoice_id,
    client_name: cn,
    service: sv,
    amount,
    date: new Date().toISOString().slice(0, 10),
    status: String(status || "draft"),
    created_at: Date.now(),
  };
  const all = readLedger();
  all.unshift(row);
  while (all.length > 500) all.pop();
  writeLedger(all);
  return { ...row };
}

function markPaid(invoice_id) {
  const all = readLedger();
  const row = all.find((x) => x.invoice_id === invoice_id);
  if (row) {
    row.status = "paid";
    row.paid_at = Date.now();
    writeLedger(all);
    return { ...row };
  }
  return null;
}

function listRecent(limit = 12) {
  return readLedger().slice(0, limit).map((x) => ({ ...x }));
}

module.exports = {
  generateInvoice,
  markPaid,
  listRecent,
  INVOICE_FILE: FILE,
};
