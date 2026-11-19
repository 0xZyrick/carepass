"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { Beneficiary, Category, MERCHANTS, Merchant, TopupRequest, Tx } from "./data";
import type { Decision } from "./guardrail";
import { ago, clock, daysSince } from "./format";

interface Toast { id: number; msg: string; tone: "ok" | "warn" }
export interface Me { id: string; name: string; email: string; role: "sponsor" | "family" | "clinic" | null; hasPin?: boolean }
export interface MyClinic { id: string; name: string; type: Category; city: "Lagos" | "Abuja"; area: string; bankName: string; accountLast4: string; verified: boolean }
export interface ClinicPayment { chainTx?: string; hasReceipt?: boolean; settlement?: { status: "pending" | "paid" | "failed"; ngn: number; ref?: string; reason?: string }; id: string; amount: number; at: string; ref: string; note: string; patient: string; daysAgo: number; time: string }
export interface CareStep { id: string; idx: number; title: string; category: Category; priceUsd: number; when: string; clinicId: string; clinicName: string; status: "pending" | "done"; doneAt: string | null; receiptId: string | null }
export interface CarePlan { escrow: boolean; lockedUsd: number; id: string; passId: string; packageId: string; title: string; status: "active" | "complete" | "cancelled"; totalUsd: number; doneCount: number; nextStepId: string | null; steps: CareStep[]; at: string }
export interface ClinicVisit { id: string; title: string; priceUsd: number; status: "pending" | "done"; doneAt: string | null; patient: string; package: string }
export type ClinicInput = { name: string; type: Category; city: "Lagos" | "Abuja"; area: string; bankName: string; accountLast4: string; accountNumber?: string };

type NewPass = {
  fullName: string; email: string; relation: string; phone: string; city: "Lagos" | "Abuja";
  allowed: Category[];
};
export type PayResult = { decision: Decision; tx: Tx };
export type PayOutcome = PayResult | { error: string; status: number };

interface Store {
  me: Me | null;
  loading: boolean;
  previewEnabled: boolean;
  fundingProviders: "anchor"[];
  carePlans: CarePlan[];
  visits: ClinicVisit[];
  startPlan: (passId: string, packageId: string, providers: Record<string, string>) => Promise<boolean>;
  cancelPlan: (id: string) => Promise<void>;
  getVisitCode: (stepId: string) => Promise<{ code: string; clinicName: string; title: string } | null>;
  confirmVisit: (code: string) => Promise<{ title: string; priceUsd: number; patient: string } | null>;
  beneficiaries: Beneficiary[];
  merchants: Merchant[];
  myClinic: MyClinic | null;
  clinicPayments: ClinicPayment[];
  txs: Tx[];
  requests: TopupRequest[];
  toasts: Toast[];
  activePassId: string;
  setActivePassId: (id: string) => void;
  totalCredit: number;
  settledThisMonth: number;
  settledCount: number;
  blockedCount: number;
  refresh: () => Promise<void>;
  topUp: (id: string, amount: number, method: string) => Promise<Tx | null>;
  startFunding: (passId: string, amount: number, provider: "anchor") => Promise<{ id: string; url: string } | null>;
  syncFunding: (id: string) => Promise<"done" | "pending" | "failed">;
  addBeneficiary: (b: NewPass) => Promise<Beneficiary | null>;
  updateBeneficiary: (id: string, patch: Partial<Pick<Beneficiary, "frozen" | "allowed">>) => Promise<boolean>;
  pay: (id: string, dest: string, amount: number, note?: string, pin?: string) => Promise<PayOutcome>;
  createPin: (pin: string) => Promise<boolean>;
  saveClinic: (c: ClinicInput, existing: boolean) => Promise<boolean>;
  requestTopUp: (id: string, amount: number, note: string) => Promise<boolean>;
  dismissRequest: (id: string) => Promise<void>;
  seedDemo: (reset?: boolean) => Promise<boolean>;
  signOut: () => Promise<void>;
  toast: (msg: string, tone?: "ok" | "warn") => void;
}

const Ctx = createContext<Store | null>(null);
const PASS_KEY = "carepass.activePass";

/* ── server → UI mapping (dates are computed in the viewer's own time zone) ── */
const mapB = (b: Beneficiary): Beneficiary => ({ ...b, lastActive: ago(b.lastActiveAt) });
const mapTx = (t: Tx): Tx => ({ ...t, daysAgo: t.at ? daysSince(t.at) : 0, time: t.at ? clock(t.at) : "" });
const mapReq = (r: TopupRequest): TopupRequest => ({ ...r, daysAgo: r.at ? daysSince(r.at) : 0 });

async function call<T>(url: string, method: string, data?: unknown): Promise<{ ok: boolean; status: number; json: T & { error?: string } }> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : undefined,
      body: data ? JSON.stringify(data) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  } catch {
    return { ok: false, status: 0, json: { error: "Can't reach CarePass. Check your connection." } as never };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewEnabled, setPreview] = useState(false);
  const [fundingProviders, setProviders] = useState<"anchor"[]>([]);
  const [carePlans, setPlans] = useState<CarePlan[]>([]);
  const [visits, setVisits] = useState<ClinicVisit[]>([]);
  const [beneficiaries, setB] = useState<Beneficiary[]>([]);
  const [clinics, setClinics] = useState<Merchant[]>([]);
  const [myClinic, setMyClinic] = useState<MyClinic | null>(null);
  const [clinicPayments, setClinicPayments] = useState<ClinicPayment[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [requests, setReq] = useState<TopupRequest[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activePassId, setActive] = useState("");
  const wanted = useRef("");
  const path = usePathname();
  const loaded = useRef(false);

  const toast = useCallback((msg: string, tone: "ok" | "warn" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const setActivePassId = useCallback((id: string) => {
    wanted.current = id; setActive(id);
    try { localStorage.setItem(PASS_KEY, id); } catch {}
  }, []);

  const refresh = useCallback(async () => {
    const r = await call<{ me: Me; previewEnabled: boolean; fundingProviders: "anchor"[]; carePlans: CarePlan[]; visits: ClinicVisit[]; beneficiaries: Beneficiary[]; clinics: Merchant[]; myClinic: MyClinic | null; clinicPayments: (Omit<ClinicPayment, "daysAgo" | "time">)[]; txs: Tx[]; requests: TopupRequest[] }>("/api/state", "GET");
    if (r.ok) {
      const bs = r.json.beneficiaries.map(mapB);
      setMe(r.json.me); setPreview(r.json.previewEnabled); setProviders(r.json.fundingProviders ?? []); setPlans(r.json.carePlans ?? []); setVisits(r.json.visits ?? []);
      setClinics(r.json.clinics ?? []); setMyClinic(r.json.myClinic ?? null);
      setClinicPayments((r.json.clinicPayments ?? []).map((p) => ({ ...p, daysAgo: daysSince(p.at), time: clock(p.at) })));
      setB(bs); setTxs(r.json.txs.map(mapTx)); setReq(r.json.requests.map(mapReq));
      if (!wanted.current) { try { wanted.current = localStorage.getItem(PASS_KEY) ?? ""; } catch {} }
      setActive((cur) => {
        const pick = [cur, wanted.current].find((id) => id && bs.some((b) => b.id === id));
        return pick ?? bs[0]?.id ?? "";
      });
    } else if (r.status === 401) {
      setMe(null); setPlans([]); setVisits([]); setB([]); setTxs([]); setReq([]); setClinics([]); setMyClinic(null); setClinicPayments([]);
    }
    loaded.current = true;
    setLoading(false);
  }, []);

  // Only signed-in areas load account data, so public pages make no API calls (and no 401s).
  useEffect(() => {
    if (/^\/(sponsor|pass|clinic)(\/|$)/.test(path ?? "")) { if (!loaded.current) { setLoading(true); void refresh(); } }
    else if (!loaded.current) setLoading(false);
  }, [path, refresh]);

  const fail = useCallback((msg?: string) => { toast(msg ?? "Something went wrong. Please try again.", "warn"); return null; }, [toast]);

  const value: Store = useMemo(() => {
    const month = txs.filter((t) => t.daysAgo < 30);
    const paid = month.filter((t) => t.kind === "payment");
    return {
      me, loading, previewEnabled, fundingProviders, carePlans, visits, beneficiaries, myClinic, clinicPayments,
      merchants: previewEnabled ? [...MERCHANTS, ...clinics] : clinics,
      txs, requests, toasts, activePassId, setActivePassId,
      totalCredit: beneficiaries.reduce((s, b) => s + b.balance, 0),
      settledThisMonth: paid.reduce((s, t) => s + t.amount, 0),
      settledCount: paid.length,
      blockedCount: month.filter((t) => t.kind === "blocked").length,
      toast, refresh,
      topUp: async (id, amount, method) => {
        const r = await call<{ tx: Tx }>(`/api/passes/${id}/topup`, "POST", { amount, method });
        if (!r.ok) return fail(r.json.error);
        await refresh(); return mapTx(r.json.tx);
      },
      startFunding: async (passId, amount, provider) => {
        const r = await call<{ id: string; url: string }>("/api/funding", "POST", { passId, amount, provider });
        if (!r.ok) return fail(r.json.error);
        return { id: r.json.id, url: r.json.url };
      },
      syncFunding: async (id) => {
        const r = await call<{ funding: { credited: boolean; status: string } }>(`/api/funding/${id}/sync`, "POST");
        if (!r.ok) return "pending";
        if (r.json.funding.credited) { await refresh(); return "done"; }
        return r.json.funding.status === "failed" ? "failed" : "pending";
      },
      addBeneficiary: async (input) => {
        const r = await call<{ beneficiary: Beneficiary }>("/api/passes", "POST", input);
        if (!r.ok) return fail(r.json.error);
        await refresh(); return mapB(r.json.beneficiary);
      },
      updateBeneficiary: async (id, patch) => {
        const prev = beneficiaries;
        setB((p) => p.map((b) => (b.id === id ? { ...b, ...patch } : b)));
        const r = await call(`/api/passes/${id}`, "PATCH", patch);
        if (!r.ok) { setB(prev); fail(r.json.error); return false; }
        return true;
      },
      pay: async (id, dest, amount, note, pin) => {
        const r = await call<PayResult>(`/api/passes/${id}/pay`, "POST", { dest, amount, note, pin });
        if (!r.ok) return { error: r.json.error ?? "Something went wrong. Please try again.", status: r.status };
        await refresh(); return { decision: r.json.decision, tx: mapTx(r.json.tx) };
      },
      createPin: async (pin) => {
        const r = await call("/api/me/pin", "POST", { pin });
        if (!r.ok) { fail(r.json.error); return false; }
        await refresh(); return true;
      },
      saveClinic: async (c, existing) => {
        const r = await call("/api/clinic", existing ? "PATCH" : "POST", c);
        if (!r.ok) { fail(r.json.error); return false; }
        await refresh(); return true;
      },
      requestTopUp: async (id, amount, note) => {
        const r = await call(`/api/passes/${id}/request`, "POST", { amount, note });
        if (!r.ok) { fail(r.json.error); return false; }
        await refresh(); return true;
      },
      dismissRequest: async (id) => {
        setReq((p) => p.filter((x) => x.id !== id));
        const r = await call(`/api/requests/${id}`, "DELETE");
        if (!r.ok) { fail(r.json.error); await refresh(); }
      },
      startPlan: async (passId, packageId, providers) => {
        const r = await call("/api/care/plans", "POST", { passId, packageId, providers });
        if (!r.ok) { fail(r.json.error); return false; }
        await refresh(); return true;
      },
      cancelPlan: async (id) => { const r = await call(`/api/care/plans/${id}/cancel`, "POST"); if (!r.ok) fail(r.json.error); await refresh(); },
      getVisitCode: async (stepId) => {
        const r = await call<{ code: string; clinicName: string; title: string }>(`/api/care/steps/${stepId}/code`, "GET");
        if (!r.ok) return fail(r.json.error);
        return r.json;
      },
      confirmVisit: async (code) => {
        const r = await call<{ title: string; priceUsd: number; patient: string }>("/api/clinic/visits", "POST", { code });
        if (!r.ok) return fail(r.json.error);
        await refresh(); return r.json;
      },
      seedDemo: async (reset) => {
        const r = await call(`/api/demo/seed${reset ? "?reset=1" : ""}`, "POST");
        if (!r.ok) { fail(r.json.error); return false; }
        wanted.current = ""; await refresh(); return true;
      },
      signOut: async () => {
        const { authClient } = await import("./auth-client");
        await authClient.signOut();
        try { localStorage.removeItem(PASS_KEY); } catch {}
        wanted.current = ""; setMe(null); setB([]); setTxs([]); setReq([]); setActive("");
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, loading, previewEnabled, fundingProviders, beneficiaries, clinics, myClinic, clinicPayments, txs, requests, toasts, activePassId, toast, refresh, fail]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}
