import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/55 px-4 py-8 text-sm text-slate-600 backdrop-blur dark:border-white/10 dark:bg-black/20 dark:text-slate-300 sm:px-6 lg:px-8">
      <div className="site-container flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="font-semibold text-slate-900 dark:text-white">오늘의 카카오뱅크</p>
          <p className="mt-2 leading-6">
            카카오뱅크와 제휴하거나 공식 운영되는 서비스가 아닌 독립 뉴스 분석 서비스입니다.
            AI가 생성한 요약과 영향 분석은 오류가 있을 수 있으므로 중요한 판단에는 원문을 함께
            확인해 주세요.
          </p>
        </div>
        <nav aria-label="서비스 안내" className="flex flex-wrap gap-x-5 gap-y-2 font-semibold">
          <Link href="/about" className="hover:text-[#0066cc] hover:underline dark:hover:text-[#2997ff]">
            서비스·분석 방법
          </Link>
          <Link href="/archive" className="hover:text-[#0066cc] hover:underline dark:hover:text-[#2997ff]">
            브리핑 아카이브
          </Link>
        </nav>
      </div>
    </footer>
  );
}
