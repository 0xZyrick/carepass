"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, ReactNode } from "react";
import { Beneficiary, Hue, MERCHANTS, SEED_BENEFICIARIES } from "./data";
import { ActivityEvent, CareEpisode, Confirmation, EventKind, PACKAGES, SEED_EPISODES, SEED_EVENTS, pkgOf, stepPayout, visitCode } from "./care";
import { fundingFee, makeRef, usd } from "./format";

interface Toast { id: number; msg: string; tone: "ok" | "warn" }

export interface ConfirmResult { ok: boolean; reason?: "no-docs" | "bad-code"; payout?: number; completed?: boolean }

interface Store {
  beneficiaries: Beneficiary[];
  episodes: CareEpisode[];
  events: ActivityEvent[];
  toasts: Toast[];
  activePassId: string;
  setActivePassId: (id: string) => void;
  addBeneficiary: (b: Omit<Beneficiary, "id" | "initials" | "hue">) => Beneficiary;
  startEpisode: (beneficiaryId: string, packageId: string, providerId: string) => CareEpisode;
  addDoc: (id: string, file: File) => void;
  confirmVisit: (id: string, code: string, receipt?: File | null) => ConfirmResult;
  fundEpisode: (id: string, amount: number, method?: string) => { ref: string; fee: number } | null;
  toast: (msg: string, tone?: "ok" | "warn") => void;
}

const Ctx = createContext<Store | null>(null);
const HUES: Hue[] = ["sun", "rose", "iris", "brand"];
const rid = () => Math.random().toString(36).slice(2, 7);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [beneficiaries, setB] = useState(SEED_BENEFICIARIES);
  const [episodes, setEps] = useState<CareEpisode[]>(SEED_EPISODES);
  const [events, setEvents] = useState<ActivityEvent[]>(SEED_EVENTS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activePassId, setActivePassId] = useState("mom");

  // Always-current snapshot so action callbacks never read stale state.
  const live = useRef({ episodes, beneficiaries });
  live.current = { episodes, beneficiaries };

  const toast = useCallback((msg: string, tone: "ok" | "warn" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  const log = useCallback((episodeId: string, kind: EventKind, title: string, detail?: string) => {
    setEvents((ev) => [{ id: "v" + rid(), episodeId, kind, title, detail, daysAgo: 0 }, ...ev]);
  }, []);

  const value: Store = useMemo(
    () => ({
      beneficiaries, episodes, events, toasts, activePassId, setActivePassId, toast,

      addBeneficiary: (input) => {
        const initials = input.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
        const b: Beneficiary = { ...input, id: "b" + rid(), initials, hue: HUES[live.current.beneficiaries.length % HUES.length] };
        setB((p) => [...p, b]);
        return b;
      },

      startEpisode: (beneficiaryId, packageId, providerId) => {
        const ep: CareEpisode = { id: "e" + rid(), beneficiaryId, packageId, providerId, done: 1, startedDaysAgo: 0, funded: 0, fundings: [], confirms: {}, docs: [] };
        const who = live.current.beneficiaries.find((b) => b.id === beneficiaryId)?.name ?? "your family";
        const prov = MERCHANTS.find((m) => m.id === providerId)?.name ?? "the provider";
        setEps((p) => [ep, ...p]);
        log(ep.id, "started", `${pkgOf(packageId).name} started`, `For ${who} at ${prov}`);
        toast("Care package started");
        return ep;
      },

      fundEpisode: (id, amount, method = "Visa •••• 4242") => {
        const e = live.current.episodes.find((x) => x.id === id);
        if (!e || amount <= 0) return null;
        const fee = fundingFee(amount);
        const ref = makeRef();
        setEps((p) => p.map((x) => (x.id === id ? { ...x, funded: +(x.funded + amount).toFixed(2), fundings: [{ id: ref, amount, fee, daysAgo: 0, method }, ...x.fundings] } : x)));
        log(id, "funded", `You funded ${usd(amount)}`, "Held and released step by step");
        return { ref, fee };
      },

      addDoc: (id, file) => {
        setEps((p) => p.map((x) => (x.id === id ? { ...x, docs: [...x.docs, { name: file.name, url: URL.createObjectURL(file) }] } : x)));
        log(id, "docs", "Documents sent to the provider", "Only the provider can see these");
        toast("Sent to the provider");
      },

      confirmVisit: (id, code, receipt) => {
        const e = live.current.episodes.find((x) => x.id === id);
        if (!e) return { ok: false };
        const intake = e.done === 1;
        if (intake && e.docs.length === 0) return { ok: false, reason: "no-docs" };
        if (!intake && code.trim() !== visitCode(e)) return { ok: false, reason: "bad-code" };

        const pkg = PACKAGES.find((p) => p.id === e.packageId)!;
        const total = pkg.steps.length;
        const by = MERCHANTS.find((m) => m.id === e.providerId)?.name ?? "Provider";
        const c: Confirmation = { by, daysAgo: 0, ...(receipt ? { receipt: { name: receipt.name, url: URL.createObjectURL(receipt) } } : {}) };
        const payout = stepPayout(e);
        const completed = e.done + 1 >= total;
        setEps((p) => p.map((x) => (x.id === id ? { ...x, done: Math.min(total, x.done + 1), confirms: { ...x.confirms, [x.done]: c } } : x)));
        log(id, completed ? "completed" : "confirmed", completed ? `${pkg.name} completed` : `${pkg.steps[e.done]} confirmed`, `${by}${payout > 0 ? ` · ${usd(payout)} released` : ""}`);
        toast(completed ? "Package completed" : "Step confirmed");
        return { ok: true, payout, completed };
      },
    }),
    [beneficiaries, episodes, events, toasts, activePassId, toast, log]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}
