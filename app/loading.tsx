export default function Loading() {
  return (
    <main
      className="min-h-[70vh] px-4 pb-20 pt-8 sm:px-6 lg:px-8"
      role="status"
      aria-label="페이지 불러오는 중"
    >
      <div className="site-container animate-pulse">
        <div className="h-4 w-24 rounded-full bg-blue-100 dark:bg-blue-500/15" />
        <div className="mt-4 h-10 w-72 max-w-[72vw] rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 h-5 w-full max-w-2xl rounded-full bg-slate-200/80 dark:bg-slate-800/80" />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <div className="h-64 rounded-[28px] border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.035] lg:col-span-2" />
          <div className="h-64 rounded-[28px] border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.035]" />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="h-44 rounded-[24px] border border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/[0.025]" />
          <div className="h-44 rounded-[24px] border border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/[0.025]" />
          <div className="h-44 rounded-[24px] border border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/[0.025]" />
        </div>
      </div>
      <span className="sr-only">콘텐츠를 준비하고 있습니다.</span>
    </main>
  );
}
