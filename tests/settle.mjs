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
const sp = new Client(), fam = new Client(), cl = new Client(), anon = new Client();
const famEmail = `mom${stamp}@test.dev`, PIN = "4827";
await sp.signIn(`sp${stamp}@test.dev`, "sponsor", "Tunde O");
const created = await sp.req("/api/passes", "POST", { fullName: "Adebola Okonkwo", email: famEmail, relation: "Mom", phone: "", city: "Lagos", allowed: ["hospital"] });
const pid = created.json.beneficiary.id;
await sp.req(`/api/passes/${pid}/topup`, "POST", { amount: 200 });
await fam.signIn(famEmail, "family", "Adebola Okonkwo"); await fam.req("/api/me/pin", "POST", { pin: PIN });
await cl.signIn(`cl${stamp}@test.dev`, "clinic", "Dr B");
const mk = await cl.req("/api/clinic", "POST", { name: "Settle Clinic", type: "hospital", city: "Lagos", bankName: "GTBank", accountNumber: "0123456789" });
ok(mk.status === 201 && mk.json.clinic.accountLast4 === "6789", "full account number saved, only last 4 shown");
ok(!JSON.stringify(mk.json).includes("0123456789") && !/Enc/.test(JSON.stringify(mk.json)), "response carries no account number or sealed field");
ok((await cl.req("/api/clinic", "PATCH", { name: "Settle Clinic", type: "hospital", city: "Lagos", bankName: "GTBank", accountNumber: "12" })).json.clinic?.accountLast4 !== "12", "short account number ignored");
const code = mk.json.clinic.id;

console.log("Receipt and settlement");
const pay = await fam.req(`/api/passes/${pid}/pay`, "POST", { pin: PIN, dest: `carepass:clinic:${code}`, amount: 32, note: "Malaria panel" });
ok(pay.status === 200 && pay.json.decision.approved, "payment approved");
const tid = pay.json.tx.id;
ok(/^[0-9a-f]{64}$/.test(pay.json.tx.receiptHash ?? ""), "payment carries a receipt hash");
const v = await anon.req(`/api/verify/${tid}`);
ok(v.status === 200 && v.json.intact === true && v.json.hash === pay.json.tx.receiptHash, "anyone with the link can verify: intact");
ok(v.json.chain.checked === false, "no network record when the chain is off");
ok(v.json.receipt.clinic === "Settle Clinic" && v.json.receipt.amountCents === 3200 && v.json.receipt.note === "", "receipt content is right (note hidden)");
ok(!JSON.stringify(v.json).includes(famEmail) && !/Adebola/.test(JSON.stringify(v.json)), "receipt does not name the patient");
ok((await anon.req(`/api/verify/${crypto.randomUUID()}`)).status === 404, "unknown receipt → 404");
await new Promise((r) => setTimeout(r, 1500));
const cs = (await cl.req("/api/state")).json;
const cp = cs.clinicPayments[0];
ok(cp?.settlement?.status === "paid" && cp.settlement.ngn === 32 * 1529, "clinic paid in Naira at the locked rate: ₦" + cp?.settlement?.ngn);
ok(cp.hasReceipt === true, "clinic sees a verify link");
const ss = (await sp.req("/api/state")).json;
ok(ss.txs.find((t) => t.id === tid)?.settled === true, "sender sees the clinic was paid");
const v2 = await anon.req(`/api/verify/${tid}`);
ok(v2.json.paidInNaira?.ngn === 32 * 1529, "verify page shows the Naira settlement");
ok((await sp.req(`/api/clinic/settlement/${tid}/retry`, "POST")).status === 403, "sponsor can't retry a payout");
const cl2 = new Client(); await cl2.signIn(`cl2${stamp}@test.dev`, "clinic", "Dr C"); await cl2.req("/api/clinic", "POST", { name: "Other Clinic", type: "lab", city: "Lagos" });
ok((await cl2.req(`/api/clinic/settlement/${tid}/retry`, "POST")).status === 404, "another clinic can't touch this payout");
const blocked = await fam.req(`/api/passes/${pid}/pay`, "POST", { pin: PIN, dest: `carepass:clinic:${code}`, amount: 500 });
ok(blocked.json.decision?.approved === false && !blocked.json.tx.receiptHash, "refused payments get no receipt");
console.log("TID", tid);
console.log(`\n${pass} passed, ${fail} failed`);
