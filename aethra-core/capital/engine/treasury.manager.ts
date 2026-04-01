import { appendCashflowLog } from "../accounting/profit.tracker";

type TreasuryState = {
  balance: number;
  allocated: number;
  reserved: number;
  withdrawn: number;
};

const treasury: TreasuryState = {
  balance: 0,
  allocated: 0,
  reserved: 0,
  withdrawn: 0,
};

export function updateTreasury(amount: number, source = "unknown") {
  const delta = Number(amount || 0);
  treasury.balance += delta;
  appendCashflowLog({
    event: "treasury_update",
    source,
    amount: delta,
    treasury: { ...treasury },
  });
}

export function applyTreasuryMove(move: { allocated?: number; reserved?: number; withdrawn?: number }, note = "move") {
  const allocated = Number(move.allocated || 0);
  const reserved = Number(move.reserved || 0);
  const withdrawn = Number(move.withdrawn || 0);
  treasury.allocated += allocated;
  treasury.reserved += reserved;
  treasury.withdrawn += withdrawn;
  treasury.balance -= allocated + reserved + withdrawn;
  appendCashflowLog({
    event: "treasury_move",
    note,
    allocated,
    reserved,
    withdrawn,
    treasury: { ...treasury },
  });
}

export function getTreasury(): TreasuryState {
  return { ...treasury };
}
