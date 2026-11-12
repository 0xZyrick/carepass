const FX_RATE = 1529; // demo rate: 1 USD ≈ ₦1,529
const FEE_RATE = 0.01; // 1% sponsor funding fee
const MIN_FEE = 0.5;
export const MIN_FUND = 10;

export const usd = (n: number, digits = 2) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);

export const ngn = (usdAmount: number) => "₦" + Math.round(usdAmount * FX_RATE).toLocaleString("en-US");

export const fxLabel = () => `$1 = ₦${FX_RATE.toLocaleString("en-US")}`;

export const fundingFee = (amount: number) =>
  amount <= 0 ? 0 : Math.max(MIN_FEE, +(amount * FEE_RATE).toFixed(2));

export const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

/** Formats a Nigerian number as the person types: +234 802 555 0142 */
export const formatNgPhone = (raw: string) => {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("234")) d = d.slice(3);
  else if (d.startsWith("0")) d = d.slice(1);
  d = d.slice(0, 10);
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean);
  return parts.length ? "+234 " + parts.join(" ") : "";
};
export const phoneDigits = (s: string) => s.replace(/\D/g, "");

/** Short reference like CP-7K3QX */
export const makeRef = () => "CP-" + Math.random().toString(36).slice(2, 7).toUpperCase();
