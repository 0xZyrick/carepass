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
const anon = new Client(), cl = new Client(), sp = new Client();
console.log("Cash-out guards");
ok((await anon.req("/api/clinic/payout")).status === 401, "anonymous → 401");
await cl.signIn(`clinic${stamp}@test.dev`, "clinic", "Dr Test");
await sp.signIn(`sp${stamp}@test.dev`, "sponsor", "Sp Test");
ok((await sp.req("/api/clinic/payout")).status === 403, "sponsor can't use clinic cash-out");
ok((await cl.req("/api/clinic/payout")).status === 404, "no clinic yet → 404");
await cl.req("/api/clinic", "POST", { name: "Payout Clinic", type: "hospital", city: "Lagos" });
const g = await cl.req("/api/clinic/payout");
ok(g.status === 200 && g.json.enabled === false && g.json.payouts.length === 0, "network off → cash-out hidden");
ok((await cl.req("/api/clinic/payout", "POST")).status === 503, "start without anchor → 503");
ok((await cl.req("/api/clinic/payout/nope/sync", "POST")).status === 404 || (await cl.req("/api/clinic/payout/nope/sync", "POST")).status === 502, "unknown payout id not found");
ok((await sp.req("/api/clinic/payout/x/sync", "POST")).status === 403, "sponsor can't sync a cash-out");
console.log(`\n${pass} passed, ${fail} failed`);
