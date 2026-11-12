import { MERCHANTS, Merchant, City } from "./data";

export type PackageIcon = "baby" | "microscope" | "scissors" | "heartpulse";

export interface CarePackage {
  id: string;
  name: string;
  blurb: string;
  timeline: string;
  price: [number, number];
  icon: PackageIcon;
  who: string;
  includes: string[];
  excludes: string[];
  bring: string[];
  steps: string[];
  providerIds: string[];
}

export interface Confirmation {
  by: string;
  /** days before today; 0 = today */
  daysAgo: number;
  receipt?: { name: string; url: string };
}

export interface Funding {
  id: string;
  amount: number;
  fee: number;
  daysAgo: number;
  method: string;
}

export interface CareEpisode {
  id: string;
  beneficiaryId: string;
  packageId: string;
  providerId: string;
  /** number of confirmed steps. Step 0 is "Package selected" and is always confirmed */
  done: number;
  startedDaysAgo: number;
  funded: number;
  fundings: Funding[];
  confirms: Record<number, Confirmation>;
  docs: { name: string; url: string }[];
}

export type EventKind = "started" | "funded" | "docs" | "confirmed" | "completed";
export interface ActivityEvent {
  id: string;
  episodeId: string;
  kind: EventKind;
  title: string;
  detail?: string;
  daysAgo: number;
}

export const PACKAGES: CarePackage[] = [
  {
    id: "maternity", name: "Maternity pathway", blurb: "Antenatal care through to delivery at a vetted facility.",
    timeline: "9 months", price: [450, 900], icon: "baby", who: "Expectant mothers",
    includes: ["Booking visit and scheduled antenatal visits", "Basic antenatal labs and scans", "Delivery facility reserved"],
    excludes: ["Emergency surgery beyond a standard delivery", "Intensive care for baby"],
    bring: ["Photo ID", "Antenatal card if she has one", "Phone number of a birth partner"],
    steps: ["Package selected", "Intake and documents", "Booking visit", "Antenatal visits", "Delivery plan confirmed", "Delivery", "Package closed"],
    providerIds: ["m1", "m4", "m9"],
  },
  {
    id: "diagnostic", name: "Diagnostic workup", blurb: "A consult, the right tests, and a results review.",
    timeline: "1–2 weeks", price: [60, 180], icon: "microscope", who: "New or unexplained symptoms",
    includes: ["Specialist consultation", "Agreed labs and imaging", "Results review visit"],
    excludes: ["Treatment or surgery after diagnosis", "Prescription drugs"],
    bring: ["Photo ID", "Past test results", "List of current medications"],
    steps: ["Package selected", "Intake and documents", "Consultation", "Labs and imaging", "Results review", "Package closed"],
    providerIds: ["m1", "m2", "m7", "m9"],
  },
  {
    id: "surgery", name: "Elective surgery", blurb: "Pre-op, procedure and post-op checks at one facility.",
    timeline: "4–8 weeks", price: [600, 2400], icon: "scissors", who: "Planned procedures",
    includes: ["Pre-op assessment and tests", "Procedure within the agreed band", "Post-op checks"],
    excludes: ["Complications needing extended admission", "Long-term rehabilitation"],
    bring: ["Photo ID", "Referral letter", "Past scans or reports"],
    steps: ["Package selected", "Intake and documents", "Pre-op assessment", "Procedure", "Post-op check", "Package closed"],
    providerIds: ["m1", "m4", "m9"],
  },
  {
    id: "chronic", name: "Chronic follow-up", blurb: "A 3-month review cycle for ongoing conditions.",
    timeline: "3 months", price: [90, 140], icon: "heartpulse", who: "Ongoing conditions",
    includes: ["Baseline review", "Monthly check-ins", "Routine labs"],
    excludes: ["Hospital admission", "Specialist procedures"],
    bring: ["Photo ID", "Current medications", "Last clinic card"],
    steps: ["Package selected", "Intake and documents", "Baseline review", "Month 1 check", "Month 3 review", "Package closed"],
    providerIds: ["m1", "m9", "m2", "m7"],
  },
];

export const pkgOf = (id: string) => PACKAGES.find((p) => p.id === id)!;
export const providersFor = (p: CarePackage, city: City): Merchant[] =>
  p.providerIds.map((id) => MERCHANTS.find((m) => m.id === id)!).filter((m) => m && m.city === city);
export const isClosed = (e: CareEpisode) => e.done >= pkgOf(e.packageId).steps.length;

/** Steps that unlock a payout: every step after "Package selected". */
export const payableSteps = (p: CarePackage) => p.steps.length - 1;

/** What one confirmed step releases to the provider. */
export const stepPayout = (e: CareEpisode) => +(e.funded / payableSteps(pkgOf(e.packageId))).toFixed(2);

export const released = (e: CareEpisode) => {
  const n = pkgOf(e.packageId).steps.length;
  return +(e.funded * Math.min(1, Math.max(0, e.done - 1) / (n - 1))).toFixed(2);
};
export const held = (e: CareEpisode) => +(e.funded - released(e)).toFixed(2);

export const progressPct = (e: CareEpisode) => Math.round((Math.min(e.done, pkgOf(e.packageId).steps.length) / pkgOf(e.packageId).steps.length) * 100);

export type EpisodeState = "needs-funding" | "awaiting-intake" | "in-progress" | "completed";
export const stateOf = (e: CareEpisode): EpisodeState =>
  isClosed(e) ? "completed" : e.funded <= 0 ? "needs-funding" : e.done === 1 ? "awaiting-intake" : "in-progress";

export const visitCode = (e: CareEpisode) => {
  let h = 7;
  (e.id + e.done).split("").forEach((c) => { h = (h * 31 + c.charCodeAt(0)) % 9000; });
  return String(1000 + h);
};

/** Human label for how long ago something happened. */
export const when = (daysAgo: number) =>
  daysAgo <= 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;

export const SEED_EPISODES: CareEpisode[] = [
  {
    id: "e1", beneficiaryId: "mom", packageId: "diagnostic", providerId: "m1", done: 3, startedDaysAgo: 6, funded: 120,
    fundings: [{ id: "CP-4F2K9", amount: 120, fee: 1.2, daysAgo: 6, method: "Visa •••• 4242" }],
    confirms: {
      1: { by: "Lagoon Hospital", daysAgo: 5 },
      2: { by: "Lagoon Hospital", daysAgo: 2 },
    },
    docs: [{ name: "Referral-letter.pdf", url: "#" }],
  },
];

export const SEED_EVENTS: ActivityEvent[] = [
  { id: "v5", episodeId: "e1", kind: "confirmed", title: "Consultation confirmed", detail: "Lagoon Hospital · $24.00 released", daysAgo: 2 },
  { id: "v4", episodeId: "e1", kind: "confirmed", title: "Intake confirmed", detail: "Lagoon Hospital · $24.00 released", daysAgo: 5 },
  { id: "v3", episodeId: "e1", kind: "docs", title: "Documents sent to the provider", detail: "Only the provider can see these", daysAgo: 5 },
  { id: "v2", episodeId: "e1", kind: "funded", title: "You funded $120.00", detail: "Held and released step by step", daysAgo: 6 },
  { id: "v1", episodeId: "e1", kind: "started", title: "Diagnostic workup started", detail: "For Adebola at Lagoon Hospital", daysAgo: 6 },
];
