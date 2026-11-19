/**
 * Partners shown on the landing page.
 * status "live"    → shown as a confirmed partner.
 * status "planned" → shown with an "Integrating" tag. Flip to "live" once the agreement/integration is signed.
 */
export type PartnerStatus = "live" | "planned";

export interface Partner {
  id: "stellar" | "soroban" | "yellowcard" | "ramp";
  name: string;
  role: string;
  blurb: string;
  status: PartnerStatus;
}

export const PARTNERS: Partner[] = [
  { id: "stellar", name: "Stellar", role: "Settlement network", blurb: "Settlement layer. USDC moves in seconds for a fraction of a cent, built for cross-border payments.", status: "live" },
  { id: "soroban", name: "Soroban", role: "Smart contracts", blurb: "Rules engine. The merchant whitelist, care types and freeze switch are enforced by a contract, not by us.", status: "live" },
  { id: "yellowcard", name: "Yellow Card", role: "Naira payout", blurb: "Licensed on/off-ramp that converts USDC to Naira so verified clinics are paid in local currency.", status: "planned" },
  { id: "ramp", name: "MoonPay", role: "Funding (USD / GBP in)", blurb: "Licensed checkout so sponsors in the US and UK can fund with a card or bank transfer. Connected in sandbox today.", status: "live" },
];

export const CORRIDORS = ["United States", "United Kingdom", "Nigeria"];
