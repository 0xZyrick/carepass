export const FX_RATE = 1529; // demo rate: 1 USD ≈ ₦1,529
export const FEE_RATE = 0.01; // 1% sponsor funding fee
export const MIN_FEE = 0.5;

export const usd = (n: number, digits = 2) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);

export const ngn = (usdAmount: number) =>
  "₦" + Math.round(usdAmount * FX_RATE).toLocaleString("en-US");

export const fundingFee = (amount: number) =>
  amount <= 0 ? 0 : Math.max(MIN_FEE, +(amount * FEE_RATE).toFixed(2));

export function dayLabel(daysAgo: number) {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return new Date(Date.now() - daysAgo * 86400000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Whole local calendar days between an ISO timestamp and now. */
export function daysSince(iso: string) {
  const a = new Date(iso); const n = new Date();
  const d0 = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const d1 = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  return Math.max(0, Math.round((d1 - d0) / 86400000));
}

export const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export function ago(iso: string | null | undefined) {
  if (!iso) return "Not yet active";
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  if (mins < 2) return "Just now";
  if (mins < 60) return `${Math.floor(mins)} min ago`;
  const d = daysSince(iso);
  if (d === 0) return "Today";
  return d === 1 ? "Yesterday" : `${d} days ago`;
}

export const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};
