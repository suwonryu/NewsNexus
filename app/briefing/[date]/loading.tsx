export default function Loading() {
  return (
    <div className="min-h-screen px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1320px] animate-pulse">
        <header className="mb-4 rounded-2xl border border-white/70 bg-white/82 px-5 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-950/70 dark:shadow-[0_20px_48px_rgba(2,6,23,0.42)] md:rounded-[28px]">
          <div className="md:flex md:items-center md:justify-between md:gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="mt-3 h-8 w-56 max-w-[70vw] rounded-full bg-slate-200 dark:bg-slate-800 md:h-10 md:max-w-md" />
              </div>
              <div className="h-10 w-[136px] rounded-full bg-slate-200 dark:bg-slate-800 md:hidden" />
            </div>

            <div className="mt-3 hidden flex-wrap items-center gap-2 md:mt-0 md:flex md:justify-end">
              <div className="h-10 w-[136px] rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-10 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-10 w-28 rounded-full bg-blue-100 dark:bg-blue-500/15" />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 md:hidden">
            <div className="h-10 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-28 rounded-full bg-blue-100 dark:bg-blue-500/15" />
          </div>
        </header>

        <section className="rounded-[30px] border border-white/70 bg-white/84 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-950/70 dark:shadow-[0_24px_54px_rgba(2,6,23,0.42)]">
          <div className="h-3 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="mt-4 h-8 max-w-sm rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="mt-6 space-y-3">
            <div className="h-4 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-[92%] rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-[76%] rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="h-24 rounded-3xl bg-slate-100 dark:bg-slate-900/75" />
            <div className="h-24 rounded-3xl bg-slate-100 dark:bg-slate-900/75" />
            <div className="h-24 rounded-3xl bg-slate-100 dark:bg-slate-900/75" />
          </div>
        </section>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[30px] border border-white/70 bg-white/84 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-950/70 dark:shadow-[0_24px_54px_rgba(2,6,23,0.42)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="h-3 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="mt-3 h-8 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-8 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="h-48 rounded-[28px] bg-slate-100 dark:bg-slate-900/75" />
              <div className="h-48 rounded-[28px] bg-slate-100 dark:bg-slate-900/75" />
              <div className="h-48 rounded-[28px] bg-slate-100 dark:bg-slate-900/75" />
              <div className="h-48 rounded-[28px] bg-slate-100 dark:bg-slate-900/75" />
            </div>
          </section>

          <div className="grid gap-4">
            <section className="rounded-[30px] border border-white/70 bg-white/84 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-950/70 dark:shadow-[0_24px_54px_rgba(2,6,23,0.42)]">
              <div className="h-3 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="mt-3 h-8 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="mt-4 space-y-3">
                <div className="h-28 rounded-3xl bg-blue-50 dark:bg-blue-500/10" />
                <div className="h-28 rounded-3xl bg-blue-50 dark:bg-blue-500/10" />
                <div className="h-28 rounded-3xl bg-blue-50 dark:bg-blue-500/10" />
              </div>
            </section>

            <section className="rounded-[30px] border border-white/70 bg-white/84 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-950/70 dark:shadow-[0_24px_54px_rgba(2,6,23,0.42)]">
              <div className="h-3 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="mt-3 h-8 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="h-8 w-24 rounded-full bg-slate-100 dark:bg-slate-900/75" />
                <div className="h-8 w-28 rounded-full bg-slate-100 dark:bg-slate-900/75" />
                <div className="h-8 w-20 rounded-full bg-slate-100 dark:bg-slate-900/75" />
                <div className="h-8 w-32 rounded-full bg-slate-100 dark:bg-slate-900/75" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
