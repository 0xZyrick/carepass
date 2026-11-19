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
const sp = new Client(), fam = new Client(), anon = new Client();
const famEmail = `mom${stamp}@test.dev`, PIN = "4827";
await sp.signIn(`sp${stamp}@test.dev`, "sponsor", "Tunde O");
const mkPass = async (allowed, perTx = 150, email = famEmail) => (await sp.req("/api/passes", "POST", { fullName: "Adebola Okonkwo", email, relation: "Mom", phone: "", city: "Lagos", allowed })).json.beneficiary.id;
const clinics = {};
for (const [type, name] of [["hospital", "Care Hospital"], ["lab", "Care Lab"], ["pharmacy", "Care Pharmacy"]]) {
  const c = new Client(); await c.signIn(`${type}${stamp}@test.dev`, "clinic", "Owner " + type);
  const r = await c.req("/api/clinic", "POST", { name, type, city: "Lagos" });
  clinics[type] = { client: c, id: r.json.clinic.id };
}
const providers = { hospital: clinics.hospital.id, lab: clinics.lab.id, pharmacy: clinics.pharmacy.id };

console.log("Plan rules");
const thin = await mkPass(["hospital"], 150, `thin${stamp}@test.dev`);
ok((await sp.req("/api/care/plans", "POST", { passId: thin, packageId: "checkup", providers })).status === 400, "pass without every care type is refused");
const pid = await mkPass(["hospital", "lab", "pharmacy"]);
await sp.req(`/api/passes/${pid}/topup`, "POST", { amount: 70 });
ok((await sp.req("/api/care/plans", "POST", { passId: pid, packageId: "nope", providers })).status === 400, "unknown package refused");
ok((await sp.req("/api/care/plans", "POST", { passId: pid, packageId: "checkup", providers: { ...providers, lab: clinics.pharmacy.id } })).status === 400, "provider of the wrong kind refused");
ok((await anon.req("/api/care/plans", "POST", {})).status === 401, "anonymous → 401");
const made = await sp.req("/api/care/plans", "POST", { passId: pid, packageId: "checkup", providers });
ok(made.status === 201, "plan created");
ok((await sp.req("/api/care/plans", "POST", { passId: pid, packageId: "antenatal", providers })).status === 409, "second active plan refused");

console.log("Family, sponsor and clinic views");
await fam.signIn(famEmail, "family", "Adebola Okonkwo"); await fam.req("/api/me/pin", "POST", { pin: PIN });
let fs = (await fam.req("/api/state")).json;
const plan = fs.carePlans[0];
ok(plan?.steps.length === 4 && plan.doneCount === 0 && plan.nextStepId === plan.steps[0].id, "family sees the plan with step 1 next");
const ss = (await sp.req("/api/state")).json;
ok(ss.carePlans[0]?.id === plan.id, "sponsor sees the plan");
ok(!/code/i.test(JSON.stringify(ss.carePlans)), "plan data carries no visit codes");
const cs0 = (await clinics.hospital.client.req("/api/state")).json;
ok(cs0.visits.length === 2 && cs0.visits.every((v) => v.patient === "Adebola O."), "hospital sees its 2 planned visits, first name only");
ok(!JSON.stringify(cs0.visits).includes(famEmail), "no patient email on the clinic side");

console.log("Visit codes release payment");
const [s1, s2] = plan.steps;
ok((await fam.req(`/api/care/steps/${s2.id}/code`)).status === 409, "can't get a code for a later step");
const c1 = await fam.req(`/api/care/steps/${s1.id}/code`);
ok(c1.status === 200 && /^\d{6}$/.test(c1.json.code), "family gets a 6-digit code for step 1");
const H = clinics.hospital.client;
ok((await H.req("/api/clinic/visits", "POST", { code: "12" })).status === 400, "short code refused");
ok((await clinics.lab.client.req("/api/clinic/visits", "POST", { code: c1.json.code })).status === 400, "another clinic can't use the code");
ok((await H.req("/api/clinic/visits", "POST", { code: c1.json.code === "000000" ? "000001" : "000000" })).status === 400, "wrong code refused");
const before = (await fam.req("/api/state")).json.beneficiaries[0].balance;
const conf = await H.req("/api/clinic/visits", "POST", { code: c1.json.code });
ok(conf.status === 200 && conf.json.priceUsd === 30 && conf.json.patient === "Adebola", "correct code confirms the visit");
fs = (await fam.req("/api/state")).json;
ok(Math.round((before - fs.beneficiaries[0].balance) * 100) === 3000, "$30 released from the pass");
ok(fs.carePlans[0].doneCount === 1 && fs.carePlans[0].nextStepId === s2.id, "milestone recorded, step 2 is next");
const rid = fs.carePlans[0].steps[0].receiptId;
const ver = await anon.req(`/api/verify/${rid}`);
ok(ver.status === 200 && ver.json.intact && ver.json.receipt.note === "", "step receipt verifies and shows no health note");
ok((await H.req("/api/clinic/visits", "POST", { code: c1.json.code })).status === 400, "a used code can't be reused");

console.log("Funds and order");
const c2 = await fam.req(`/api/care/steps/${s2.id}/code`);
const L = clinics.lab.client;
const short = await L.req("/api/clinic/visits", "POST", { code: c2.json.code });
ok(short.status === 200, "step 2 ($40) confirmed with $40 left");
const c3 = await fam.req(`/api/care/steps/${fs.carePlans[0].steps[2].id}/code`);
const noFunds = await H.req("/api/clinic/visits", "POST", { code: c3.json.code });
ok(noFunds.status === 409 && /enough funds/.test(noFunds.json.error), "no funds: visit stays open, clear message");
ok((await fam.req("/api/state")).json.carePlans[0].doneCount === 2, "step 3 still pending");
await sp.req(`/api/passes/${pid}/topup`, "POST", { amount: 100 });
ok((await H.req("/api/clinic/visits", "POST", { code: c3.json.code })).status === 200, "after top-up the same code works");
const c4 = await fam.req(`/api/care/steps/${(await fam.req("/api/state")).json.carePlans[0].steps[3].id}/code`);
ok((await clinics.pharmacy.client.req("/api/clinic/visits", "POST", { code: c4.json.code })).status === 200, "last step confirmed");
ok((await fam.req("/api/state")).json.carePlans[0].status === "complete", "plan is complete");

console.log("Guessing is limited");
const pid2 = await mkPass(["hospital", "lab", "pharmacy"], 150, `g${stamp}@test.dev`);
await sp.req("/api/care/plans", "POST", { passId: pid2, packageId: "checkup", providers });
let last; for (let i = 0; i < 6; i++) last = await H.req("/api/clinic/visits", "POST", { code: String(111111 + i) });
ok(last.status === 429, "5 wrong codes lock the clinic out for a while");
console.log(`\n${pass} passed, ${fail} failed`);
