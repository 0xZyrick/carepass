import { Beneficiary, MERCHANTS, Merchant, CATEGORIES, Tx } from "./data";
import { usd } from "./format";

export interface Check {
  id: string;
  label: string;
  status: "pass" | "fail" | "skipped";
  detail: string;
}

export interface Decision {
  approved: boolean;
  merchant?: Merchant;
  checks: Check[];
  headline: string;
  reason: string;
}

const FULL = /^G[A-Z2-7]{55}$/i; // Stellar public key
const SHORT = /^G[A-Z2-7]{3}(…|\.{2,3})[A-Z2-7]{4}$/i;

export function findMerchant(input: string): Merchant | undefined {
  const d = input.trim().toUpperCase().replace("...", "…");
  if (!d) return undefined;
  return MERCHANTS.find((m) => m.addr.toUpperCase() === d || m.short.toUpperCase() === d);
}

export function spentThisMonth(txs: Tx[], id: string) {
  return txs
    .filter((t) => t.kind === "payment" && t.beneficiaryId === id && t.daysAgo < 30)
    .reduce((s, t) => s + t.amount, 0);
}

/** Pure rule engine — the same logic the on-chain guardrail is modelled on. */
export type Rules = Pick<Beneficiary, "frozen" | "allowed" | "perTxLimit" | "monthlyLimit" | "balance">;

export function evaluatePayment(
  b: Rules,
  dest: string,
  amount: number,
  spent: number
): Decision {
  const checks: Check[] = [];
  let failed = false;
  const run = (id: string, label: string, ok: boolean, passMsg: string, failMsg: string) => {
    if (failed) return checks.push({ id, label, status: "skipped", detail: "Not reached" });
    if (!ok) failed = true;
    checks.push({ id, label, status: ok ? "pass" : "fail", detail: ok ? passMsg : failMsg });
  };

  const valid = FULL.test(dest.trim()) || SHORT.test(dest.trim());
  const m = findMerchant(dest);

  run("pass", "Pass is active", !b.frozen, "Pass is active and unlocked", "Pass is frozen by the sponsor");
  run("format", "Destination is valid", valid, "Address format is valid", "That doesn't look like a Stellar address (starts with G)");
  run("whitelist", "Verified merchant", !!m, `${m?.name} is on the on-chain whitelist`, "Destination is not a verified hospital, lab or pharmacy");
  const cat = m ? CATEGORIES.find((c) => c.id === m.type)?.plural : "";
  run("category", "Care type allowed", !!m && b.allowed.includes(m.type), `${cat} are allowed on this pass`, `${cat ?? "This"} isn't enabled on this pass`);
  run("cap", "Within payment cap", amount <= b.perTxLimit, `${usd(amount)} is under the ${usd(b.perTxLimit, 0)} per-payment cap`, `Exceeds the ${usd(b.perTxLimit, 0)} per-payment cap`);
  run("monthly", "Within monthly limit", spent + amount <= b.monthlyLimit, `${usd(b.monthlyLimit - spent - amount, 0)} left of this month's limit after this`, `Would exceed the ${usd(b.monthlyLimit, 0)} monthly limit`);
  run("balance", "Enough care credit", amount <= b.balance, "Balance covers this payment", `Only ${usd(b.balance)} available`);

  const bad = checks.find((c) => c.status === "fail");
  return bad
    ? {
        approved: false,
        merchant: m,
        checks,
        headline: bad.id === "whitelist" || bad.id === "format" ? "Blocked by guardrail" : "Payment declined",
        reason:
          bad.id === "whitelist"
            ? "Funds stay locked in the CarePass wallet — zero leakage."
            : bad.detail + ".",
      }
    : {
        approved: true,
        merchant: m,
        checks,
        headline: "Approved & settled",
        reason: "USDC settles on Stellar within seconds, then is paid out in Naira through Yellow Card.",
      };
}
