import type { Category } from "./data";

/** Care packages. Each step is something a family does at a verified provider; the price is released when the provider confirms the visit. Prices are estimates until providers set their own. */
export interface PackageStep { title: string; category: Category; priceCents: number; when: string }
export interface CarePackage { id: string; title: string; blurb: string; steps: PackageStep[] }

export const PACKAGES: CarePackage[] = [
  {
    id: "antenatal", title: "Antenatal care", blurb: "Check-ups, scans and medicines through pregnancy.",
    steps: [
      { title: "Booking visit and first scan", category: "hospital", priceCents: 6000, when: "First trimester" },
      { title: "Routine blood and urine tests", category: "lab", priceCents: 3500, when: "First trimester" },
      { title: "Mid-pregnancy scan", category: "hospital", priceCents: 5000, when: "Second trimester" },
      { title: "Supplements and medicines", category: "pharmacy", priceCents: 2500, when: "Ongoing" },
    ],
  },
  {
    id: "checkup", title: "Health check-up", blurb: "A doctor visit, tests and a review, start to finish.",
    steps: [
      { title: "Doctor consultation", category: "hospital", priceCents: 3000, when: "Week 1" },
      { title: "Blood count and sugar tests", category: "lab", priceCents: 4000, when: "Week 1" },
      { title: "Results review and prescription", category: "hospital", priceCents: 2500, when: "Week 2" },
      { title: "Prescribed medicines", category: "pharmacy", priceCents: 3000, when: "Week 2" },
    ],
  },
  {
    id: "chronic", title: "Ongoing care", blurb: "Monthly follow-up for long-term conditions like blood pressure or diabetes.",
    steps: [
      { title: "Monthly doctor review", category: "hospital", priceCents: 2500, when: "Month 1" },
      { title: "Monitoring tests", category: "lab", priceCents: 3000, when: "Month 1" },
      { title: "Monthly medicines", category: "pharmacy", priceCents: 3500, when: "Month 1" },
    ],
  },
  {
    id: "dental", title: "Dental care", blurb: "An exam and cleaning, then treatment if it's needed.",
    steps: [
      { title: "Dental exam and cleaning", category: "dental", priceCents: 5000, when: "Week 1" },
      { title: "Treatment visit", category: "dental", priceCents: 8000, when: "Week 2" },
      { title: "Pain relief and antibiotics", category: "pharmacy", priceCents: 1500, when: "Week 2" },
    ],
  },
];
export const packageById = (id: string) => PACKAGES.find((p) => p.id === id);
export const packageTotal = (p: CarePackage) => p.steps.reduce((s, x) => s + x.priceCents, 0);
