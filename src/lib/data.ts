export type Category = "hospital" | "lab" | "pharmacy" | "dental" | "optical";
export type Hue = "brand" | "iris" | "sun" | "rose";
export type City = "Lagos" | "Abuja";

export const CITIES: City[] = ["Lagos", "Abuja"];

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
  city: City;
  type: Category;
  addr: string;
  short: string;
  distKm: number;
  hours: string;
  open: boolean;
  phone: string;
  blurb: string;
}

const F = "5d9a1c0e7b34f26880ad41e9c37b5f02";
const mk = (pre: string, suf: string) => ({
  addr: `0x${pre}${F}${suf}`,
  short: `0x${pre}…${suf}`,
});

export const MERCHANTS: Merchant[] = [
  { id: "m1", name: "Lagoon Hospital", area: "Ikeja", city: "Lagos", type: "hospital", ...mk("7a3f", "c9e2"), distKm: 1.2, hours: "Open 24 hours", open: true, phone: "+234 700 555 0101", blurb: "Multi-specialty hospital with on-site labs, imaging and a maternity wing." },
  { id: "m2", name: "PathCare Diagnostics", area: "Yaba", city: "Lagos", type: "lab", ...mk("4b1d", "8f01"), distKm: 2.8, hours: "Open · closes 6 PM", open: true, phone: "+234 700 555 0102", blurb: "Walk-in laboratory and imaging centre with same-day results." },
  { id: "m3", name: "HealthPlus Pharmacy", area: "Maryland", city: "Lagos", type: "pharmacy", ...mk("9e22", "a4b7"), distKm: 0.9, hours: "Open · closes 10 PM", open: true, phone: "+234 700 555 0103", blurb: "Pharmacy with pharmacist consultations and chronic medication refills." },
  { id: "m4", name: "Reddington Hospital", area: "Victoria Island", city: "Lagos", type: "hospital", ...mk("2c88", "1d3e"), distKm: 6.4, hours: "Open 24 hours", open: true, phone: "+234 700 555 0104", blurb: "Private hospital known for surgery, maternity and specialist clinics." },
  { id: "m5", name: "Smile Lagos Dental", area: "Lekki", city: "Lagos", type: "dental", ...mk("c5e1", "70aa"), distKm: 9.1, hours: "Opens 8 AM", open: false, phone: "+234 700 555 0105", blurb: "General and restorative dentistry with same-week appointments." },
  { id: "m6", name: "ClearView Opticals", area: "Surulere", city: "Lagos", type: "optical", ...mk("1f90", "e3b5"), distKm: 4.3, hours: "Open · closes 7 PM", open: true, phone: "+234 700 555 0106", blurb: "Eye tests, prescription lenses and frames." },
  { id: "m7", name: "Wuse Diagnostics Centre", area: "Wuse II", city: "Abuja", type: "lab", ...mk("a8d4", "2e17"), distKm: 1.7, hours: "Open · closes 5 PM", open: true, phone: "+234 700 555 0107", blurb: "Full-service laboratory and imaging suite in central Abuja." },
  { id: "m8", name: "Maitama Family Pharmacy", area: "Maitama", city: "Abuja", type: "pharmacy", ...mk("6b0c", "f9d3"), distKm: 2.2, hours: "Open · closes 9 PM", open: true, phone: "+234 700 555 0108", blurb: "Family pharmacy with delivery within Maitama and Asokoro." },
  { id: "m9", name: "Garki General Hospital", area: "Garki", city: "Abuja", type: "hospital", ...mk("e2a7", "4c68"), distKm: 3.5, hours: "Open 24 hours", open: true, phone: "+234 700 555 0109", blurb: "General hospital with specialist outpatient clinics and a delivery suite." },
];

export const merchantOf = (id: string) => MERCHANTS.find((m) => m.id === id);

export interface Beneficiary {
  id: string;
  name: string;
  fullName: string;
  relation: string;
  phone: string;
  city: City;
  initials: string;
  hue: Hue;
}

export const SEED_BENEFICIARIES: Beneficiary[] = [
  { id: "mom", name: "Adebola", fullName: "Adebola Okonkwo", relation: "Mom", phone: "+234 802 555 0142", city: "Lagos", initials: "AO", hue: "brand" },
  { id: "sister", name: "Chioma", fullName: "Chioma Okonkwo", relation: "Sister", phone: "+234 809 555 0197", city: "Abuja", initials: "CO", hue: "iris" },
];

/** Demo sponsor profile. Single source so shells, settings and greetings agree. */
export const SPONSOR = {
  name: "Tunde Okonkwo",
  first: "Tunde",
  initials: "TO",
  email: "tunde@example.com",
  location: "London, UK",
};
