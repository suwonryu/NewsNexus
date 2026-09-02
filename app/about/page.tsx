import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '서비스와 분석 방법 | 오늘의 카카오뱅크',
  description: '오늘의 카카오뱅크가 뉴스를 수집·분류·요약하고 영향을 분석하는 방법과 한계를 안내합니다.',
  alternates: { canonical: 'https://news.kabang.app/about' },
};

export default function AboutPage() {
  return (
    <main className="min-h-[70vh] px-4 py-12 sm:px-6 lg:px-8">
      <article className="site-container max-w-4xl rounded-[28px] border border-slate-200 bg-white/90 p-7 shadow-[0_18px_60px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-white/[0.04] sm:p-10">
        <p className="text-sm font-semibold text-[#0071e3] dark:text-[#2997ff]">서비스 안내</p>
        <h1 className="mt-2 text-3xl font-[750] tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">
          뉴스 분석 방법과 한계
        </h1>
        <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
          오늘의 카카오뱅크는 여러 언론사의 공개 보도를 카카오뱅크와의 관련성, 동일 사건 여부,
          예상 영향 관점으로 정리합니다. 카카오뱅크가 운영하거나 보증하는 공식 서비스는 아닙니다.
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <MethodSection title="1. 관련성 분류">
            제목과 요약에서 카카오뱅크가 사건의 직접 주체인지 확인합니다. 단순 언급, 퀴즈·경품,
            여러 사건을 섞은 종합 기사는 핵심 이슈에서 제외합니다.
          </MethodSection>
          <MethodSection title="2. 이슈 묶기">
            제목 유사도, 핵심 기관·상품·수치, 사건 단계와 날짜를 함께 사용해 같은 사건의 중복 보도를
            하나의 이슈로 묶습니다.
          </MethodSection>
          <MethodSection title="3. 영향 분석">
            수익성, 비용, 신용·건전성, 규제, 브랜드·고객, 서비스 운영, 성장 관점에서 긍정·부정·혼합·중립
            가능성을 표시합니다. 보도 수와 매체 수가 적으면 신뢰도를 낮게 표시합니다.
          </MethodSection>
          <MethodSection title="4. 품질 확인">
            이슈 제목과 요약이 같은 사건을 설명하는지 검사하고, 관련 없는 문장은 제거합니다. 기준을
            충족하지 못한 이슈는 기본 화면에 노출하지 않습니다.
          </MethodSection>
        </div>

        <section className="mt-10 rounded-2xl bg-slate-100 p-5 dark:bg-white/[0.06]" aria-labelledby="limits-heading">
          <h2 id="limits-heading" className="font-semibold text-slate-950 dark:text-white">알아두실 점</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <li>요약과 영향 평가는 AI와 규칙 기반 분석으로 생성되며 사실 오류가 생길 수 있습니다.</li>
            <li>긍정·부정 표시는 주가 전망이나 투자 권유가 아닙니다.</li>
            <li>기사의 권리와 책임은 각 언론사에 있으며, 세부 내용은 연결된 원문을 기준으로 합니다.</li>
          </ul>
        </section>
      </article>
    </main>
  );
}

function MethodSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-[700] text-slate-950 dark:text-white">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{children}</p>
    </section>
  );
}
