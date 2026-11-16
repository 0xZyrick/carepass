export type Category = "hospital" | "lab" | "pharmacy" | "dental" | "optical";
export type Hue = "brand" | "iris" | "sun" | "rose";

export const CATEGORIES: { id: Category; label: string; plural: string }[] = [
  { id: "hospital", label: "Hospital", plural: "Hospitals & clinics" },
  { id: "lab", label: "Diagnostic lab", plural: "Labs & diagnostics" },
  { id: "pharmacy", label: "Pharmacy", plural: "Pharmacies" },
  { id: "dental", label: "Dental", plural: "Dental care" },
  { id: "optical", label: "Optical", plural: "Eye care" },
];

export interface Merchant {
  id: string;
  name: string;
  area: string;
  city: "Lagos" | "Abuja";
  type: Category;
  addr: string;
  short: string;
  distKm: number;
  hours: string;
  open: boolean;
}

// Demo Stellar-style public keys: "G" + 55 base32 chars (not real accounts).
const F = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOP";
const mk = (pre: string, suf: string) => ({
  addr: `${pre}${F}${suf}`,
  short: `${pre}…${suf}`,
});

export const MERCHANTS: Merchant[] = [
  { id: "m1", name: "Lagoon Hospital", area: "Ikeja", city: "Lagos", type: "hospital", ...mk("GA7F", "K2QX"), distKm: 1.2, hours: "Open 24 hours", open: true },
  { id: "m2", name: "PathCare Diagnostics", area: "Yaba", city: "Lagos", type: "lab", ...mk("GB4D", "R7FA"), distKm: 2.8, hours: "Open · closes 6 PM", open: true },
  { id: "m3", name: "HealthPlus Pharmacy", area: "Maryland", city: "Lagos", type: "pharmacy", ...mk("GC5E", "M4B7"), distKm: 0.9, hours: "Open · closes 10 PM", open: true },
  { id: "m4", name: "Reddington Hospital", area: "Victoria Island", city: "Lagos", type: "hospital", ...mk("GD2C", "T3DE"), distKm: 6.4, hours: "Open 24 hours", open: true },
  { id: "m5", name: "Smile Lagos Dental", area: "Lekki", city: "Lagos", type: "dental", ...mk("GE5E", "P7AA"), distKm: 9.1, hours: "Opens 8 AM", open: false },
  { id: "m6", name: "ClearView Opticals", area: "Surulere", city: "Lagos", type: "optical", ...mk("GF3Q", "E3B5"), distKm: 4.3, hours: "Open · closes 7 PM", open: true },
  { id: "m7", name: "Wuse Diagnostics Centre", area: "Wuse II", city: "Abuja", type: "lab", ...mk("GAD4", "S2E7"), distKm: 1.7, hours: "Open · closes 5 PM", open: true },
  { id: "m8", name: "Maitama Family Pharmacy", area: "Maitama", city: "Abuja", type: "pharmacy", ...mk("GB6B", "W5D3"), distKm: 2.2, hours: "Open · closes 9 PM", open: true },
  { id: "m9", name: "Garki General Hospital", area: "Garki", city: "Abuja", type: "hospital", ...mk("GCE2", "H4C6"), distKm: 3.5, hours: "Open 24 hours", open: true },
];

export const PERSONAL_WALLET = `GDEA${F}BEEF`;
export const PERSONAL_SHORT = "GDEA…BEEF";

export interface Beneficiary {
  id: string;
  name: string;
  fullName: string;
  relation: string;
  phone: string;
  email?: string;
  sponsorName?: string;
  city: "Lagos" | "Abuja";
  initials: string;
  hue: Hue;
  balance: number;
  monthlyLimit: number;
  perTxLimit: number;
  allowed: Category[];
  frozen: boolean;
  last4: string;
  lastActive: string;
  lastActiveAt?: string | null;
}

export type TxKind = "topup" | "payment" | "blocked";
export interface Tx {
  id: string;
  kind: TxKind;
  beneficiaryId: string;
  amount: number;
  merchant?: string;
  category?: Category;
  note?: string;
  daysAgo: number;
  time: string;
  ref: string;
  method?: string;
  chainTx?: string;
  at?: string;
}

export interface TopupRequest {
  id: string;
  beneficiaryId: string;
  amount: number;
  note: string;
  daysAgo: number;
  at?: string;
}

export const SEED_BENEFICIARIES: Beneficiary[] = [
  {
    id: "mom", name: "Adebola", fullName: "Adebola Okonkwo", relation: "Mom", phone: "+234 802 555 0142",
    city: "Lagos", initials: "AO", hue: "brand", balance: 186.4, monthlyLimit: 300, perTxLimit: 150,
    allowed: ["hospital", "lab", "pharmacy"], frozen: false, last4: "8842", lastActive: "2 days ago",
  },
  {
    id: "sister", name: "Chioma", fullName: "Chioma Okonkwo", relation: "Sister", phone: "+234 809 555 0197",
    city: "Abuja", initials: "CO", hue: "iris", balance: 226.4, monthlyLimit: 250, perTxLimit: 120,
    allowed: ["hospital", "lab", "pharmacy", "dental"], frozen: false, last4: "3017", lastActive: "5 days ago",
  },
];

export const SEED_TXS: Tx[] = [
  { id: "t1", kind: "payment", beneficiaryId: "mom", amount: 45, merchant: "Lagoon Hospital", category: "hospital", note: "Consultation & tests", daysAgo: 2, time: "10:24", ref: "CP-48210" },
  { id: "t2", kind: "topup", beneficiaryId: "mom", amount: 150, daysAgo: 3, time: "18:02", ref: "CP-48177", method: "Visa •••• 4242" },
  { id: "t3", kind: "blocked", beneficiaryId: "mom", amount: 50, merchant: "Personal wallet GDEA…BEEF", note: "Destination not on the verified whitelist", daysAgo: 4, time: "21:47", ref: "CP-48151" },
  { id: "t4", kind: "payment", beneficiaryId: "sister", amount: 20, merchant: "Wuse Diagnostics Centre", category: "lab", note: "Blood panel", daysAgo: 5, time: "09:15", ref: "CP-48102" },
  { id: "t5", kind: "payment", beneficiaryId: "mom", amount: 22.5, merchant: "HealthPlus Pharmacy", category: "pharmacy", note: "Prescription refill", daysAgo: 6, time: "16:40", ref: "CP-48066" },
  { id: "t6", kind: "topup", beneficiaryId: "sister", amount: 200, daysAgo: 8, time: "12:11", ref: "CP-47990", method: "Bank transfer" },
  { id: "t7", kind: "blocked", beneficiaryId: "sister", amount: 30, merchant: "Unknown address GAXQ…77FE", note: "Destination not on the verified whitelist", daysAgo: 9, time: "20:03", ref: "CP-47954" },
  { id: "t8", kind: "topup", beneficiaryId: "mom", amount: 100, daysAgo: 21, time: "08:30", ref: "CP-47611", method: "Visa •••• 4242" },
];

export const SEED_REQUESTS: TopupRequest[] = [
  { id: "r1", beneficiaryId: "sister", amount: 75, note: "Dentist follow-up next week", daysAgo: 0 },
];
