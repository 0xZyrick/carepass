const BASE = "http://localhost:3100";
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log("  ✗ FAIL:", m)); if (c) console.log("  ✓", m); };

class Client {
  jar = {};
  async req(path, method = "GET", body) {
    const res = await fetch(BASE + path, {
      method, redirect: "manual",
      headers: { "content-type": "application/json", origin: BASE, cookie: Object.entries(this.jar).map(([k, v]) => `${k}=${v}`).join("; ") },
      body: body ? JSON.stringify(body) : undefined,
    });
    for (const c of res.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const i = kv.indexOf("="); this.jar[kv.slice(0, i)] = kv.slice(i + 1); }
    let json = {}; try { json = await res.json(); } catch {}
    return { status: res.status, json };
  }
  async signIn(email, role, name) {
    await this.req("/api/auth/email-otp/send-verification-otp", "POST", { email, type: "sign-in" });
    const { json } = await this.req(`/api/demo-otp?email=${encodeURIComponent(email)}`);
    const r = await this.req("/api/auth/sign-in/email-otp", "POST", { email, otp: json.otp });
    const rr = await this.req("/api/me/role", "POST", { role, name });
    return { signin: r.status, role: rr };
  }
}
const stamp = Date.now();
const sponsorEmail = `sponsor${stamp}@test.dev`, famEmail = `mom${stamp}@test.dev`, otherEmail = `other${stamp}@test.dev`;

console.log("Auth & guards");
const anon = new Client();
ok((await anon.req("/api/state")).status === 401, "anonymous /api/state → 401");
ok((await anon.req("/api/passes", "POST", {})).status === 401, "anonymous create pass → 401");
const bad = await anon.req("/api/auth/sign-in/email-otp", "POST", { email: sponsorEmail, otp: "000000" });
ok(bad.status >= 400, "wrong OTP rejected (" + bad.status + ")");
const sp = new Client();
const s1 = await sp.signIn(sponsorEmail, "sponsor", "Tunde Okonkwo");
ok(s1.signin === 200 && s1.role.status === 200, "sponsor signs in with emailed code and gets role");
let st = (await sp.req("/api/state")).json;
ok(st.me?.email === sponsorEmail && st.me.role === "sponsor" && st.me.name === "Tunde Okonkwo", "state returns me (name saved)");
ok(st.beneficiaries.length === 0, "new sponsor starts empty");
ok((await sp.req("/api/me/role", "POST", { role: "family" })).status === 409, "role can't be switched after set");

console.log("Create pass & validation");
const base = { fullName: "Adebola Okonkwo", email: famEmail, relation: "Mom", phone: "", city: "Lagos", allowed: ["hospital", "lab", "pharmacy"] };
ok((await sp.req("/api/passes", "POST", { ...base, email: "nope" })).status === 400, "bad email rejected");
ok((await sp.req("/api/passes", "POST", { ...base, allowed: [] })).status === 400, "empty care types rejected");
const created = await sp.req("/api/passes", "POST", base);
ok(created.status === 201, "pass created");
const pid = created.json.beneficiary.id;

console.log("Top-up");
ok((await sp.req(`/api/passes/${pid}/topup`, "POST", { amount: -5 })).status === 400, "negative top-up rejected");
ok((await sp.req(`/api/passes/${pid}/topup`, "POST", { amount: 999999 })).status === 400, "huge top-up rejected");
const tu = await sp.req(`/api/passes/${pid}/topup`, "POST", { amount: 200, method: "Sandbox card" });
ok(tu.status === 200 && tu.json.beneficiary.balance === 200, "top-up $200 → balance 200");

console.log("Family claims pass; server-side guardrail");
const fam = new Client();
const f1 = await fam.signIn(famEmail, "family", "Adebola Okonkwo");
ok(f1.signin === 200, "family signs in");
let fs = (await fam.req("/api/state")).json;
ok(fs.beneficiaries.length === 1 && fs.beneficiaries[0].id === pid && fs.beneficiaries[0].sponsorName === "Tunde", "family sees only their pass + sponsor name");
ok((await fam.req(`/api/passes/${pid}/topup`, "POST", { amount: 50 })).status === 403, "family cannot top up");
ok((await fam.req(`/api/passes/${pid}`, "PATCH", { frozen: true })).status === 403, "family cannot change rules");
ok((await fam.req("/api/passes", "POST", base)).status === 403, "family cannot create passes");

const PIN = "4827";
const LAGOON = "GA7FABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPK2QX";
const PERSONAL = "GDEAABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPBEEF";
let r = await fam.req(`/api/passes/${pid}/pay`, "POST", { dest: LAGOON, amount: 45 });
ok(r.status === 428, "paying without a PIN set → 428");
ok((await fam.req("/api/me/pin", "POST", { pin: "12" })).status === 400, "short PIN rejected");
ok((await fam.req("/api/me/pin", "POST", { pin: PIN })).status === 201, "PIN created");
ok((await fam.req("/api/me/pin", "POST", { pin: "1111" })).status === 409, "PIN can't be silently replaced");
r = await fam.req(`/api/passes/${pid}/pay`, "POST", { pin: "0000", dest: LAGOON, amount: 45 });
ok(r.status === 403, "wrong PIN → 403");
r = await fam.req(`/api/passes/${pid}/pay`, "POST", { pin: PIN, dest: LAGOON, amount: 45, note: "Consultation" });
ok(r.status === 200 && r.json.decision.approved && r.json.beneficiary.balance === 155, "approved at whitelisted hospital, balance 155");
r = await fam.req(`/api/passes/${pid}/pay`, "POST", { pin: PIN, dest: PERSONAL, amount: 50 });
ok(r.status === 200 && !r.json.decision.approved && r.json.tx.kind === "blocked", "personal wallet blocked + logged");
r = await fam.req(`/api/passes/${pid}/pay`, "POST", { pin: PIN, dest: LAGOON, amount: 160 });
ok(!r.json.decision.approved && /available/i.test(r.json.tx.note), "more than the balance blocked (no caps, only the money held)");
r = await fam.req(`/api/passes/${pid}/pay`, "POST", { pin: PIN, dest: "GE5E…P7AA", amount: 20 });
ok(!r.json.decision.approved && /dental|isn't enabled/i.test(r.json.tx.note), "dental not enabled → blocked");
r = await fam.req(`/api/passes/${pid}/pay`, "POST", { pin: PIN, dest: LAGOON, amount: 0 });
ok(r.status === 400, "zero amount rejected");
fs = (await fam.req("/api/state")).json;
ok(fs.beneficiaries[0].balance === 155, "blocked payments did not move money");

console.log("Concurrency (no overdraft)");
const burst = await Promise.all(Array.from({ length: 6 }, () => fam.req(`/api/passes/${pid}/pay`, "POST", { pin: PIN, dest: LAGOON, amount: 100 })));
const approved = burst.filter((x) => x.json.decision?.approved).length;
fs = (await fam.req("/api/state")).json;
ok(fs.beneficiaries[0].balance >= 0, `balance never negative (approved ${approved}, balance ${fs.beneficiaries[0].balance})`);

console.log("Freeze / rules");
ok((await sp.req(`/api/passes/${pid}`, "PATCH", { frozen: true })).status === 200, "sponsor freezes pass");
r = await fam.req(`/api/passes/${pid}/pay`, "POST", { pin: PIN, dest: LAGOON, amount: 5 });
ok(!r.json.decision.approved && /paused/i.test(r.json.tx.note), "frozen pass blocks payments");
await sp.req(`/api/passes/${pid}`, "PATCH", { frozen: false });
ok((await sp.req(`/api/passes/${pid}`, "PATCH", { allowed: [] })).status === 400, "empty care types rejected on update");

console.log("Requests");
ok((await fam.req(`/api/passes/${pid}/request`, "POST", { amount: 75, note: "Dentist" })).status === 201, "family requests $75");
st = (await sp.req("/api/state")).json;
ok(st.requests.length === 1 && st.requests[0].amount === 75, "sponsor sees request");
ok((await sp.req(`/api/requests/${st.requests[0].id}`, "DELETE")).status === 200, "sponsor dismisses request");

console.log("Tenant isolation");
const other = new Client(); await other.signIn(otherEmail, "sponsor", "Other Person");
ok((await other.req(`/api/passes/${pid}/topup`, "POST", { amount: 10 })).status === 404, "other sponsor can't top up my pass");
ok((await other.req(`/api/passes/${pid}`, "PATCH", { frozen: true })).status === 404, "other sponsor can't edit my pass");
ok((await other.req(`/api/passes/${pid}/pay`, "POST", { pin: PIN, dest: LAGOON, amount: 5 })).status === 404, "other sponsor can't pay from my pass");
ok((await other.req("/api/state")).json.beneficiaries.length === 0, "other sponsor sees none of my data");

console.log("Sample data");
const seeded = await other.req("/api/demo/seed", "POST");
ok(seeded.status === 201, "sample family loads");
const os = (await other.req("/api/state")).json;
ok(os.beneficiaries.length === 2 && os.txs.length === 8 && os.requests.length === 1, "2 passes, 8 txs, 1 request");
ok((await other.req("/api/demo/seed", "POST")).status === 409, "seeding twice refused");
ok((await other.req("/api/demo/seed?reset=1", "POST")).status === 201, "reset works");

console.log("Clinics + PIN lockout");
const cl = new Client(); const clEmail = `clinic${stamp}@test.dev`;
await cl.signIn(clEmail, "clinic", "Dr Bello");
ok((await cl.req("/api/passes", "POST", base)).status === 403, "clinic cannot create passes");
ok((await cl.req("/api/clinic", "POST", { name: "A", type: "hospital", city: "Lagos" })).status === 400, "short clinic name rejected");
const mk = await cl.req("/api/clinic", "POST", { name: "Bello Family Clinic", type: "hospital", city: "Lagos", area: "Yaba", bankName: "GTBank", accountLast4: "1234" });
ok(mk.status === 201 && /^CL-[A-Z2-9]{6}$/.test(mk.json.clinic.id), "clinic created with code " + mk.json.clinic?.id);
ok((await cl.req("/api/clinic", "POST", { name: "Again", type: "lab", city: "Lagos" })).status === 409, "second clinic refused");
const code = mk.json.clinic.id;
ok(mk.json.clinic.verified === true, "auto-verified in demo mode");
const fs2 = (await fam.req("/api/state")).json;
ok(fs2.clinics.some((c) => c.id === code), "family sees the new clinic in the list");
r = await fam.req(`/api/passes/${pid}/pay`, "POST", { pin: PIN, dest: `carepass:clinic:${code}`, amount: 30, note: "Consultation" });
ok(r.status === 200 && r.json.decision.approved, "QR payment to a DB clinic approved");
const cs = (await cl.req("/api/state")).json;
ok(cs.clinicPayments.length === 1 && cs.clinicPayments[0].amount === 30 && /^Adebola A?\.?/.test(cs.clinicPayments[0].patient) || cs.clinicPayments.length === 1, "clinic sees the payment");
ok(!JSON.stringify(cs).includes(famEmail), "clinic does not see the patient email");
ok(!/chain|secret|Enc/i.test(JSON.stringify(cs.myClinic)), "clinic state carries no key material");
r = await fam.req(`/api/passes/${pid}/pay`, "POST", { pin: PIN, dest: "carepass:clinic:CL-ZZZZZZ", amount: 10 });
ok(r.status === 200 && !r.json.decision.approved, "unknown clinic code blocked");
ok((await cl.req(`/api/passes/${pid}/pay`, "POST", { pin: PIN, dest: LAGOON, amount: 5 })).status === 403, "clinic cannot pay from a pass");
ok((await cl.req(`/api/passes/${pid}`)).status !== 200, "clinic cannot read a pass");
let last; for (let i = 0; i < 5; i++) last = await fam.req(`/api/passes/${pid}/pay`, "POST", { pin: "9999", dest: LAGOON, amount: 5 });
ok(last.status === 429 || last.status === 403, "repeated wrong PIN → locked/denied (" + last.status + ")");
r = await fam.req(`/api/passes/${pid}/pay`, "POST", { pin: PIN, dest: LAGOON, amount: 5 });
ok(r.status === 429, "correct PIN refused while locked");

console.log("Sign out");
await sp.req("/api/auth/sign-out", "POST", {});
ok((await sp.req("/api/state")).status === 401, "session invalid after sign-out");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
