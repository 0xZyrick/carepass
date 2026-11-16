import type { Metadata } from "next";
import { CONTACT_EMAIL, UPDATED } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy" };

const S = [
  ["What we collect", "Your name and email address, your role (sponsor, family member or clinic), the family members and clinics you add, and the amount, provider, type of care and time of each payment. Clinics also give a bank name and the last four digits of an account number."],
  ["What we don't collect", "We don't collect diagnoses, prescriptions or medical records. We never see your card details: card and bank payments are handled by our payment partner."],
  ["How we use it", "To run your account, check each payment against your rules, show you receipts and activity, send sign-in codes, and keep CarePass secure."],
  ["Who sees it", "A sponsor sees the passes and payments of the family members they support. A family member sees their own pass. A clinic sees the payments made to it, with the patient's first name and initial. We share information with the partners that move money for us, and only as needed to do that."],
  ["Your PIN", "Your PIN is stored in a scrambled form that we can't read. After several wrong tries, PIN entry is locked for a short time."],
  ["Your choices", `You can ask to see, correct or delete your information by emailing ${CONTACT_EMAIL}. Some payment records may need to be kept for legal reasons.`],
  ["Updates", "We'll update this page if something changes and show the date below."],
];

export default function Page() {
  return (
    <div className="container-x max-w-3xl pb-24 pt-12">
      <div className="eyebrow">Legal</div>
      <h1 className="mt-3 font-display text-5xl font-semibold">Privacy policy</h1>
      <p className="mt-3 text-sm text-ink-mute">Last updated {UPDATED}</p>
      <div className="mt-10 space-y-8">
        {S.map(([h, p]) => <section key={h}><h2 className="font-display text-2xl font-semibold">{h}</h2><p className="mt-2 leading-relaxed text-ink-soft">{p}</p></section>)}
      </div>
    </div>
  );
}
