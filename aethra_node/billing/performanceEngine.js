"use strict";

function calculateFee(amount, feeRate = 0.05) {
  const a = Number(amount) || 0;
  const rate = Number(feeRate);
  const safeRate = Number.isFinite(rate) ? rate : 0.05;
  return Math.round(a * safeRate * 100) / 100;
}

function splitPayment(amount, feeRate = 0.05) {
  const fee = calculateFee(amount, feeRate);
  const net = Math.round(((Number(amount) || 0) - fee) * 100) / 100;
  return { fee, net };
}

module.exports = { calculateFee, splitPayment };

