export default function Loading() {
  return (
    <div className="min-h-screen px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1320px] animate-pulse">
        <header className="mb-4 flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/82 px-5 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="h-3 w-24 rounded-full bg-slate-200" />
            <div className="mt-3 h-10 max-w-md rounded-full bg-slate-200" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-10 w-28 rounded-full bg-slate-200" />
            <div className="h-10 w-28 rounded-full bg-cyan-100" />
          </div>
        </header>

        <section className="rounded-[30px] border border-white/70 bg-white/84 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="h-3 w-28 rounded-full bg-slate-200" />
          <div className="mt-4 h-8 max-w-sm rounded-full bg-slate-200" />
          <div className="mt-6 space-y-3">
            <div className="h-4 w-full rounded-full bg-slate-200" />
            <div className="h-4 w-[92%] rounded-full bg-slate-200" />
            <div className="h-4 w-[76%] rounded-full bg-slate-200" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="h-24 rounded-3xl bg-slate-100" />
            <div className="h-24 rounded-3xl bg-slate-100" />
            <div className="h-24 rounded-3xl bg-slate-100" />
          </div>
        </section>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[30px] border border-white/70 bg-white/84 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="h-3 w-20 rounded-full bg-slate-200" />
                <div className="mt-3 h-8 w-32 rounded-full bg-slate-200" />
              </div>
              <div className="h-8 w-20 rounded-full bg-slate-200" />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="h-48 rounded-[28px] bg-slate-100" />
              <div className="h-48 rounded-[28px] bg-slate-100" />
              <div className="h-48 rounded-[28px] bg-slate-100" />
              <div className="h-48 rounded-[28px] bg-slate-100" />
            </div>
          </section>

          <div className="grid gap-4">
            <section className="rounded-[30px] border border-white/70 bg-white/84 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="h-3 w-16 rounded-full bg-slate-200" />
              <div className="mt-3 h-8 w-28 rounded-full bg-slate-200" />
              <div className="mt-4 space-y-3">
                <div className="h-28 rounded-3xl bg-cyan-50" />
                <div className="h-28 rounded-3xl bg-cyan-50" />
                <div className="h-28 rounded-3xl bg-cyan-50" />
              </div>
            </section>

            <section className="rounded-[30px] border border-white/70 bg-white/84 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="h-3 w-16 rounded-full bg-slate-200" />
              <div className="mt-3 h-8 w-24 rounded-full bg-slate-200" />
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="h-8 w-24 rounded-full bg-slate-100" />
                <div className="h-8 w-28 rounded-full bg-slate-100" />
                <div className="h-8 w-20 rounded-full bg-slate-100" />
                <div className="h-8 w-32 rounded-full bg-slate-100" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
