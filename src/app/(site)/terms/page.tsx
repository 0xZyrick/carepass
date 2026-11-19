import type { Metadata } from "next";
import { COMPANY, CONTACT_EMAIL, UPDATED } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of use" };

const S = [
  ["Using CarePass", `${COMPANY} lets a sponsor in the US or UK send money that their family in Nigeria can spend only at verified healthcare providers. You must be 18 or older and give us accurate information to use it.`],
  ["Your account", "You sign in with a code sent to your email. Keep your email and your PIN private. You are responsible for what happens under your account, so tell us straight away if you think someone else has access."],
  ["Sending money", "When you send money to a family pass you see the amount, the fee and the Naira value before you confirm. Money on a pass can only be spent at verified providers and only for the kinds of care you allow. It can't be withdrawn as cash."],
  ["Care rules", "Sponsors choose the kinds of care allowed and fund a care plan in full. Each step of the plan has a fixed provider and amount, and the money is released only when that step is confirmed. A payment that breaks these rules, or goes to a provider that isn't verified, is refused and no money is spent."],
  ["Clinics", "Clinics must give accurate details and provide the care they are paid for. We may pause a clinic that is not genuine or that misuses CarePass."],
  ["Test mode", "CarePass is currently in test mode. Payments use test funds and no real money moves. Some details on this page will change when real payments begin, and we will tell you before they do."],
  ["Things you must not do", "Don't use CarePass for anything unlawful, to try to move money to anywhere other than a verified provider, or to interfere with the service or other people's accounts."],
  ["Changes and contact", `We may update these terms and will show the date below. Questions? Email ${CONTACT_EMAIL}.`],
];

export default function Page() {
  return (
    <div className="container-x max-w-3xl pb-24 pt-12">
      <div className="eyebrow">Legal</div>
      <h1 className="mt-3 font-display text-5xl font-semibold">Terms of use</h1>
      <p className="mt-3 text-sm text-ink-mute">Last updated {UPDATED}</p>
      <div className="mt-10 space-y-8">
        {S.map(([h, p]) => <section key={h}><h2 className="font-display text-2xl font-semibold">{h}</h2><p className="mt-2 leading-relaxed text-ink-soft">{p}</p></section>)}
      </div>
    </div>
  );
}
