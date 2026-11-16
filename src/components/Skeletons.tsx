import clsx from "clsx";

export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={clsx("skeleton", className)} />;

const Row = () => (
  <div className="flex items-center gap-3.5 px-5 py-4">
    <Skeleton className="h-11 w-11 shrink-0 !rounded-2xl" />
    <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-2/5" /><Skeleton className="h-3 w-3/5" /></div>
    <Skeleton className="h-4 w-14" />
  </div>
);

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return <div role="status" aria-live="polite" aria-label={label} className="animate-fade-in">{children}<span className="sr-only">{label}</span></div>;
}

/** Sponsor overview while data loads. */
export function SponsorSkeleton() {
  return (
    <Frame label="Loading your family's care">
      <Skeleton className="h-3.5 w-28" /><Skeleton className="mt-3 h-9 w-72 max-w-full" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="card space-y-5 p-6 sm:p-8"><Skeleton className="h-3 w-40" /><Skeleton className="h-14 w-64 max-w-full" /><Skeleton className="h-3 w-32" /><Skeleton className="h-12 w-full !rounded-2xl" /></div>
          <div className="grid gap-4 sm:grid-cols-2">{[0, 1].map((i) => <div key={i} className="card space-y-4 p-5"><div className="flex items-center gap-3"><Skeleton className="h-12 w-12 !rounded-full" /><Skeleton className="h-4 w-32" /></div><Skeleton className="h-7 w-28" /><Skeleton className="h-2 w-full" /></div>)}</div>
        </div>
        <div className="card divide-y divide-line/70 pb-1"><div className="p-5"><Skeleton className="h-5 w-36" /></div>{[0, 1, 2, 3].map((i) => <Row key={i} />)}</div>
      </div>
    </Frame>
  );
}

/** Family app while data loads. */
export function PassSkeleton() {
  return (
    <Frame label="Loading your pass">
      <div className="px-5 pb-8 pt-5">
        <div className="flex items-center gap-3"><Skeleton className="h-11 w-11 !rounded-full" /><div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-5 w-32" /></div></div>
        <Skeleton className="mt-6 h-[188px] w-full !rounded-[28px]" />
        <div className="mt-6 grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 !rounded-2xl" />)}</div>
        <div className="card mt-6 divide-y divide-line/70">{[0, 1, 2].map((i) => <Row key={i} />)}</div>
      </div>
    </Frame>
  );
}

/** Clinic dashboard while data loads. */
export function ClinicSkeleton() {
  return (
    <Frame label="Loading your clinic">
      <div className="flex items-center gap-3.5"><Skeleton className="h-11 w-11 !rounded-2xl" /><div className="space-y-2"><Skeleton className="h-7 w-56" /><Skeleton className="h-3 w-28" /></div></div>
      <div className="mt-6 grid gap-6 md:grid-cols-[320px_1fr]">
        <div className="card space-y-4 p-6"><Skeleton className="mx-auto h-6 w-24" /><Skeleton className="mx-auto aspect-square w-full max-w-[240px]" /><Skeleton className="mx-auto h-5 w-28" /></div>
        <div className="space-y-6"><div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 !rounded-2xl" />)}</div><div className="card divide-y divide-line/70">{[0, 1, 2].map((i) => <Row key={i} />)}</div></div>
      </div>
    </Frame>
  );
}

/** Generic list page. */
export function ListSkeleton() {
  return <Frame label="Loading"><div className="card divide-y divide-line/70">{[0, 1, 2, 3, 4].map((i) => <Row key={i} />)}</div></Frame>;
}
