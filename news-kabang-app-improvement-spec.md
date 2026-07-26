# news.kabang.app 개선 구현 스펙

> 문서 상태: 구현 초안 1.0  
> 기준일: 2026-07-22 (KST)  
> 대상 서비스: [오늘의 카카오뱅크](https://news.kabang.app/)  
> 우선 목표: 기사 탐색형 홈을 **브리핑·이슈 중심의 카카오뱅크 뉴스 분석 서비스**로 전환한다.

---

## 1. 목표와 범위

### 1.1 현재 상태

2026-07-22 공개 화면 기준으로 확인된 상태는 다음과 같다.

- 홈은 최신 날짜와 기사 20건을 정상 표시한다.
- 홈의 데스크톱 본문은 `날짜 / 기사 목록 / 기사 상세`의 3열 구조다.
- 최초 진입 시 가장 넓은 기사 상세 영역에는 `기사를 선택하세요`만 표시된다.
- 당일 브리핑이 생성되지 않았으면 `브리핑 준비 중` 화면을 제공한다.
- [2026-07-21 브리핑](https://news.kabang.app/briefing/2026-07-21)은 요약, AI 평가 분포, 편집 분석, 전일 대비, 카카오뱅크 영향, 대표 기사, 주목 포인트를 제공한다.
- 해당 브리핑은 수집 기사 320건 중 `관련 없음` 57건을 포함하며, 전체 320건을 기준으로 긍정·부정 비율을 계산한다.
- 2026-07-22 기사 20건 중 노조 파업 기사 4건, 청소년 도박 예방 사업 관련 기사 최소 8건이 동일 이슈를 반복 보도한다.
- 삼성전자 노조 등 카카오뱅크와 직접 관련성이 낮은 기사도 목록에 포함된다.
- 홈에는 `WebSite` 구조화 데이터, `og:site_name`, canonical이 적용되어 있다.
- 확인한 기사 상세 페이지는 `noindex, follow`를 사용한다.
- [사이트맵](https://news.kabang.app/sitemap.xml)은 홈과 최근 완료 브리핑 30개를 포함한다.
- 서버 응답상 Next.js 프리렌더링과 Vercel 캐시가 사용되고, 홈 HTML에는 2024-07-14부터 현재까지의 날짜 트리가 직렬화된다.

### 1.2 해결할 문제

1. 홈 첫 화면에서 서비스의 핵심 가치인 브리핑과 분석이 보이지 않는다.
2. 동일 사건을 여러 기사로 노출해 정보량보다 목록 길이가 커진다.
3. 카카오뱅크와 무관하거나 간접적인 기사가 평가 결과를 왜곡한다.
4. `AI평가: 긍정/부정`의 대상과 판단 근거가 불명확하다.
5. 검색엔진에 노출할 고유 콘텐츠가 날짜별 브리핑에 집중돼 있지만 내부 링크와 제목이 충분히 최적화되지 않았다.
6. 전체 날짜 트리와 중복 반응형 DOM이 초기 응답·하이드레이션 비용을 늘린다.

### 1.3 성공 상태

사용자는 홈 진입 후 별도 조작 없이 다음 내용을 파악할 수 있어야 한다.

- 오늘 또는 가장 최근에 완료된 브리핑
- 중요한 이슈 3개와 각 이슈가 카카오뱅크에 미치는 영향
- 동일 이슈를 보도한 매체 수와 대표 기사
- 다음에 확인해야 할 관찰 포인트

검색엔진에는 원문을 짧게 요약한 기사 상세보다 자체 분석이 포함된 브리핑·주제 페이지를 우선 노출한다.

### 1.4 범위 제외

- 원문 기사의 전문 저장 또는 재게시
- 사용자 계정, 개인화 추천, 댓글, 커뮤니티 기능
- 주가 예측이나 매수·매도 추천
- 기사 수집 공급자의 전면 교체
- 디자인 시스템 전체 재구축

---

## 2. 제품·기술 요구사항

### 2.1 구현 우선순위

| 순위 | 작업 | 기대 효과 | 선행 조건 |
|---|---|---|---|
| P0-1 | 홈을 최신 완료 브리핑 중심으로 변경 | 첫 화면 가치 전달, 빈 상세 영역 제거 | 완료 브리핑 조회 API |
| P0-2 | 관련도 판정과 이슈 클러스터링 도입 | 무관 기사 제거, 중복 기사 축약 | 기사 정규화 데이터 |
| P0-3 | AI 평가를 `카카오뱅크 영향`으로 재정의 | 평가의 해석 가능성 향상 | 관련 기사와 근거 문장 |
| P1-1 | 브리핑·아카이브 내부 링크와 사이트맵 개선 | 검색 발견성과 색인 안정성 향상 | 완료 브리핑 목록 API |
| P1-2 | 검색 제목·설명·구조화 데이터 개선 | 검색 결과 클릭률 개선 | 브리핑 주제·핵심 이슈 |
| P1-3 | 주제 페이지 도입 | 누적 검색 유입과 재방문 경로 확보 | 주제 분류 품질 확보 |
| P2-1 | 날짜 트리·반응형 DOM 경량화 | 초기 HTML과 하이드레이션 비용 감소 | 월별 아카이브 API |
| P2-2 | 캐시 정책과 실사용 성능 계측 | 응답 편차 감소, 회귀 탐지 | 배포 환경 설정 권한 |

### 2.2 정보 구조

#### 홈 `/`

홈은 탐색기가 아니라 최신 브리핑의 요약 페이지로 동작한다.

표시 순서:

1. 서비스 헤더
2. 최신 완료 브리핑 요약
3. 핵심 이슈 3개
4. 카카오뱅크 영향과 다음 관찰 포인트
5. 최신 기사 또는 이슈 목록
6. 날짜별 브리핑 탐색

당일 브리핑이 준비 중인 경우:

- `오늘 브리핑 집계 중` 상태를 표시한다.
- 빈 화면 대신 가장 최근 완료 브리핑을 기본 노출한다.
- 현재 수집 기사 수와 최종 갱신 시각을 보조 정보로 제공한다.
- 완료 예상 시각은 실제 보장 가능한 경우에만 표시한다.

#### 브리핑 `/briefing/{yyyy-MM-dd}`

기존 구성은 유지하되 다음 규칙을 적용한다.

- 첫 문단은 카카오뱅크 직접 관련 이슈를 우선한다.
- `전체 금융권 동향`과 `카카오뱅크 직접 영향`을 시각적으로 구분한다.
- 감성 비율은 카카오뱅크 관련 기사 집합만 사용한다.
- 각 분석 문장에는 근거 이슈 또는 대표 기사 링크를 연결한다.
- 이전·다음 날짜 링크는 실제 `<a href>`로 렌더링한다.
- 준비 중 브리핑에는 `noindex, follow`를 적용하고, 완료 시 `index, follow`로 바꾼다.

#### 아카이브 `/archive`

- 연도 → 월 → 완료 브리핑 목록을 정적 링크로 제공한다.
- 초기에는 최근 12개월을 표시한다.
- 각 항목에는 날짜, 검색용 제목, 핵심 주제 2~3개를 표시한다.
- 기사 없는 날짜와 준비 중 브리핑은 노출하지 않는다.

#### 주제 `/topics/{slug}`

초기 허용 주제:

- `earnings`: 실적·수익성
- `shareholder-return`: 배당·자사주·주주환원
- `loans`: 대출·연체율·건전성
- `ai-tech`: AI·기술·보안
- `labor`: 노사·인력
- `global`: 해외사업·제휴
- `regulation`: 금융정책·규제

생성 조건:

- 관련 완료 브리핑이 3개 이상이어야 한다.
- 자동 기사 모음만 제공하지 않고 200자 이상의 주제 설명과 최근 흐름 요약을 포함한다.
- 조건을 충족하지 못하면 페이지를 만들지 않는다.

### 2.3 홈 화면 컴포넌트

#### `LatestBriefingHero`

필수 필드:

```ts
type LatestBriefingHero = {
  briefingDate: string;       // YYYY-MM-DD
  status: 'READY' | 'PREPARING';
  headline: string;
  summary: string;            // 2~4문장
  topicTags: string[];        // 최대 5개
  updatedAt: string;          // ISO-8601
};
```

동작:

- `READY`: 해당 날짜 브리핑을 표시한다.
- `PREPARING`: 상태 배지를 표시하되, 콘텐츠는 직전 `READY` 브리핑을 표시한다.
- CTA는 `브리핑 전체 보기` 하나를 기본으로 한다.

#### `IssueClusterCard`

```ts
type IssueClusterCard = {
  id: string;
  title: string;
  summary: string;
  bankImpact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
  impactReason: string;
  articleCount: number;
  sourceCount: number;
  representativeArticleId: string;
  topicSlug?: string;
};
```

표시 규칙:

- 최대 3개를 첫 화면에 노출한다.
- `8개 매체 보도`처럼 중복 보도를 하나로 합친다.
- 영향 라벨만 단독 표시하지 않고 `impactReason`을 한 문장으로 함께 표시한다.
- 대표 기사 선정 기준은 관련도 → 출처 신뢰도 → 내용 완결성 → 발행 시각 순이다.

#### `WatchNext`

- 1~3개의 후속 관찰 항목을 제공한다.
- 각 항목은 검증 가능한 사건이나 지표로 작성한다.
- 예: `임단협 타결 여부`, `공동대출 실제 공급액`, `분기 연체율 변화`.

#### `ArticleExplorer`

현재 기사 검색·출처 필터 기능은 유지하되 보조 영역으로 이동한다.

- 기본 보기: `이슈별`
- 보조 보기: `기사별`
- 관련 없음 기사는 사용자 기본 목록에서 제외한다.
- `직접 관련`, `산업 관련` 필터를 제공한다.
- 상세가 없는 기사는 명확히 `원문만`으로 표시한다.

### 2.4 기사 관련도 판정

#### 등급

```ts
type RelevanceLevel = 'DIRECT' | 'INDUSTRY' | 'IRRELEVANT';
```

| 등급 | 정의 | 예시 |
|---|---|---|
| `DIRECT` | 카카오뱅크의 경영, 상품, 재무, 고객, 임직원, 제휴가 핵심 주제 | 카카오뱅크 파업, 배당, 신규 대출 |
| `INDUSTRY` | 인터넷은행·금융정책 변화가 카카오뱅크에 실질적으로 영향을 줄 수 있음 | 인터넷은행 기업대출 규제 |
| `IRRELEVANT` | 카카오뱅크 언급이 없거나 단순 나열·우연한 키워드 일치 | 삼성전자 노조 기사 |

#### 판정 순서

1. 제목·본문에서 기업명과 별칭을 정규화한다.
2. 규칙 기반으로 명확한 무관 기사를 우선 제거한다.
3. 남은 기사를 모델로 분류한다.
4. 모델은 `level`, `confidence`, `reason`, `matchedEntities`를 반환한다.
5. `confidence < 0.70`이면 자동 노출하지 않고 검토 대상으로 보낸다.

```json
{
  "level": "DIRECT",
  "confidence": 0.94,
  "reason": "카카오뱅크 노조의 파업 일정과 서비스 영향을 다룬 기사",
  "matchedEntities": ["카카오뱅크", "카카오뱅크 노조"]
}
```

#### 브리핑 포함 규칙

- 핵심 이슈와 영향 평가는 `DIRECT`만으로 계산한다.
- 금융권 동향 보조 섹션에는 `INDUSTRY`를 포함할 수 있다.
- `IRRELEVANT`는 통계·감성·대표 기사에서 모두 제외한다.

### 2.5 이슈 클러스터링

#### 입력 전처리

- URL 추적 파라미터 제거
- 제목 말줄임표 및 특수문자 정규화
- 출처 도메인 정규화
- 동일 canonical URL 제거
- 제목과 본문에서 인물·기관·제품·날짜·금액 추출

#### 클러스터 키

다음 신호를 조합한다.

- 제목 임베딩 유사도
- 핵심 엔터티 교집합
- 발행 시각 차이
- 핵심 사건 키워드
- 대표 숫자·날짜 일치

초기 권장값:

```yaml
title_similarity_threshold: 0.82
max_publish_time_gap_hours: 48
minimum_entity_overlap: 1
```

위 값은 운영 데이터 100개 이상을 수동 검토한 뒤 조정한다.

#### 클러스터 병합 방지

- 같은 기업이라도 사건 날짜나 핵심 행위가 다르면 별도 클러스터로 둔다.
- `실적 발표`와 `증권사 목표주가 변경`은 분리한다.
- `파업 예고`와 `파업 종료`는 분리한다.
- 임베딩 유사도만으로 자동 병합하지 않는다.

### 2.6 카카오뱅크 영향 평가

기존 `AI평가: 긍정/부정`을 다음 구조로 교체한다.

```ts
type BankImpactAssessment = {
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
  confidence: number;         // 0~1
  horizon: 'SHORT' | 'MEDIUM' | 'LONG';
  dimensions: Array<
    | 'REVENUE'
    | 'COST'
    | 'CREDIT_RISK'
    | 'REGULATION'
    | 'BRAND'
    | 'OPERATIONS'
    | 'GROWTH'
  >;
  reason: string;
  evidenceArticleIds: string[];
};
```

요구사항:

- 평가 대상은 `DIRECT` 기사 또는 직접 관련 이슈 클러스터다.
- `reason` 없이 영향 라벨만 저장하거나 노출하지 않는다.
- 사실과 해석을 별도 문장으로 생성한다.
- 투자 권유 표현을 사용하지 않는다.
- 상충하는 보도가 있으면 `MIXED`로 표시하고 양쪽 근거를 제공한다.

### 2.7 데이터 모델

기존 데이터베이스에 해당 필드가 있으면 재사용하고, 아래는 논리 모델로 적용한다.

```sql
create table article_analysis (
  article_id            bigint primary key,
  relevance_level      varchar(16) not null,
  relevance_confidence numeric(4,3) not null,
  relevance_reason     text not null,
  cluster_id            uuid,
  analyzed_at           timestamptz not null,
  analysis_version      varchar(32) not null
);

create table issue_cluster (
  id                    uuid primary key,
  cluster_date          date not null,
  title                 varchar(200) not null,
  summary               text not null,
  topic_slug            varchar(64),
  representative_article_id bigint not null,
  article_count         integer not null,
  source_count          integer not null,
  created_at            timestamptz not null,
  updated_at            timestamptz not null
);

create table issue_impact (
  cluster_id            uuid primary key references issue_cluster(id),
  impact                varchar(16) not null,
  confidence            numeric(4,3) not null,
  horizon               varchar(16) not null,
  dimensions            jsonb not null,
  reason                text not null,
  evidence_article_ids  jsonb not null,
  analysis_version      varchar(32) not null
);

create table daily_briefing (
  briefing_date         date primary key,
  status                varchar(16) not null,
  headline              varchar(200),
  summary               text,
  topic_tags            jsonb not null default '[]',
  watch_next            jsonb not null default '[]',
  relevant_article_count integer not null default 0,
  industry_article_count integer not null default 0,
  irrelevant_article_count integer not null default 0,
  published_at          timestamptz,
  updated_at            timestamptz not null,
  generation_version    varchar(32) not null
);
```

권장 인덱스:

```sql
create index idx_article_analysis_cluster on article_analysis(cluster_id);
create index idx_article_analysis_relevance on article_analysis(relevance_level, analyzed_at desc);
create index idx_issue_cluster_date on issue_cluster(cluster_date desc);
create index idx_issue_cluster_topic on issue_cluster(topic_slug, cluster_date desc);
create index idx_daily_briefing_status_date on daily_briefing(status, briefing_date desc);
```

### 2.8 API 계약

구현 언어와 관계없이 동일 의미를 제공해야 한다.

#### 최신 홈 데이터

`GET /api/home`

```json
{
  "today": "2026-07-22",
  "todayStatus": "PREPARING",
  "latestReadyBriefing": {
    "date": "2026-07-21",
    "headline": "공동대출·실명계좌 안정성과 노사 갈등이 함께 부각",
    "summary": "...",
    "topicTags": ["공동대출", "실명계좌", "노사갈등"],
    "updatedAt": "2026-07-22T00:00:11+09:00"
  },
  "topClusters": [],
  "watchNext": [],
  "collection": {
    "articleCount": 20,
    "lastCollectedAt": "2026-07-22T08:30:00+09:00"
  }
}
```

#### 날짜별 이슈

`GET /api/issues?date=2026-07-22&relevance=DIRECT&cursor={cursor}`

- 기본 `relevance`는 `DIRECT`다.
- 최대 20개 클러스터를 반환한다.
- 기사 단위가 아니라 클러스터 단위로 페이지네이션한다.

#### 브리핑

`GET /api/briefings/{date}`

- 완료: `200 READY`
- 준비 중: `200 PREPARING`과 최신 완료 브리핑 링크 제공
- 데이터 자체가 없는 과거 날짜: `404`

#### 아카이브

`GET /api/briefings?year=2026&month=7&status=READY`

- 완료 브리핑만 반환한다.
- 날짜 내림차순으로 정렬한다.

### 2.9 SEO 요구사항

#### 색인 정책

| 페이지 | robots | 사이트맵 |
|---|---|---|
| 홈 | `index, follow` | 포함 |
| 완료 브리핑 | `index, follow` | 모두 포함 |
| 준비 중 브리핑 | `noindex, follow` | 제외 |
| 기사 상세 | `noindex, follow` | 제외 |
| 조건 충족 주제 페이지 | `index, follow` | 포함 |
| 빈 날짜·빈 주제 | `noindex, follow` 또는 404 | 제외 |

사이트맵은 최근 30개로 제한하지 않고 모든 유효한 완료 브리핑을 포함한다. URL이 50,000개를 넘을 때만 분할한다.

#### 메타데이터

브리핑 title 형식:

```text
카카오뱅크 뉴스 브리핑 | {핵심 주제 2~3개} | {YYYY-MM-DD}
```

예시:

```text
카카오뱅크 뉴스 브리핑 | 공동대출·실명계좌·노사갈등 | 2026-07-21
```

description:

- 110~160자 권장
- 카카오뱅크 직접 영향과 대표 이슈를 앞부분에 배치
- 기사 수나 감성 비율만 나열하지 않음

#### 구조화 데이터

- 홈: `WebSite`, `Organization`
- 브리핑: `Article`, `BreadcrumbList`, 대표 기사 `ItemList`
- 주제 페이지: `CollectionPage`, `BreadcrumbList`
- `datePublished`는 실제 브리핑 공개 시각을 사용한다.
- `dateModified`는 내용 변경 시에만 갱신한다.

#### 내부 링크

- 홈 → 최신 완료 브리핑
- 홈 → 아카이브
- 브리핑 → 이전·다음 완료 브리핑
- 브리핑 → 관련 주제 페이지
- 주제 페이지 → 관련 브리핑
- 날짜 선택 버튼만 사용하지 말고 크롤링 가능한 `<a href>` 경로를 제공한다.

### 2.10 성능 요구사항

#### 초기 데이터 축소

- 홈에서 전체 2년치 날짜 트리를 서버 컴포넌트 props로 전달하지 않는다.
- 최근 1개월만 초기 렌더링하고 이전 월은 요청 시 불러온다.
- 모바일·데스크톱 전용 전체 DOM을 각각 렌더링하지 않는다.
- 공통 콘텐츠 DOM 하나와 CSS 반응형 배치를 사용한다.
- 홈 초기 기사 또는 클러스터 수는 최대 20개로 제한한다.

#### 렌더링

- 최신 완료 브리핑 핵심 내용은 서버 렌더링한다.
- 첫 화면 핵심 콘텐츠를 클라이언트 자바스크립트 실행 이후에만 표시하지 않는다.
- 준비 중 상태도 서버에서 결정해 화면 흔들림을 방지한다.
- 클러스터 상세·과거 아카이브만 지연 로딩한다.

#### 캐시 정책

권장 기본값이며 배포 환경에서 검증 후 확정한다.

| 대상 | 권장 정책 |
|---|---|
| 홈 | CDN 60초, `stale-while-revalidate` 300초 |
| 당일 준비 중 브리핑 | CDN 60초 |
| 완료 브리핑 | CDN 1일, `stale-while-revalidate` 7일 |
| 기사 상세 | CDN 1일 |
| 정적 자산 | 해시 파일명 + 장기 immutable |

#### 측정 항목

- 모바일 Core Web Vitals p75
- 서버 TTFB
- 초기 HTML 전송량
- 초기 JavaScript 전송량
- 첫 화면 DOM 노드 수
- 홈·브리핑 API 응답 시간

배포 전후 같은 조건에서 비교하고, 측정 환경이 다른 단발성 수치를 출시 판단 기준으로 사용하지 않는다.

### 2.11 분석·운영 지표

#### 제품 지표

- 홈 → 전체 브리핑 보기 클릭률
- 이슈 카드 → 대표 기사 클릭률
- 원문 보기 클릭률
- 7일 내 재방문율
- 브리핑 평균 스크롤 깊이

#### 콘텐츠 품질 지표

- `IRRELEVANT` 비율: 목표 5% 미만
- 잘못 병합된 클러스터 비율: 목표 3% 미만
- 병합되지 않은 중복 기사 비율: 목표 5% 미만
- 영향 평가 근거 누락률: 0%
- 브리핑 생성 실패율과 평균 완료 시각

#### 검색 지표

- 제출 대비 색인된 완료 브리핑 비율
- `카카오뱅크 뉴스`, `카카오뱅크 실적`, 주요 이슈 검색 노출
- 브리핑 페이지 검색 클릭률
- `크롤링됨-색인 안됨` 페이지 유형별 수

### 2.12 오류·예외 처리

- 수집 실패: 직전 성공 시각과 장애 상태를 표시하고 빈 최신 날짜로 전환하지 않는다.
- 분석 실패: 기사는 노출 가능하되 `분석 준비 중`으로 표시한다.
- 관련 기사 0건: 브리핑을 자동 발행하지 않고 `noindex` 준비 상태를 유지한다.
- 대표 기사 원문 삭제: 다음 순위 기사로 교체하고 삭제 링크는 비활성화한다.
- 상충 기사: 하나를 임의로 정답 처리하지 않고 차이를 요약한다.
- 모델 버전 변경: `analysis_version`을 저장해 재처리와 회귀 비교가 가능해야 한다.
- 날짜 기준: 수집·브리핑·아카이브의 날짜 계산은 `Asia/Seoul`로 통일한다.

### 2.13 접근성

- 영향 상태는 색상만으로 구분하지 않고 텍스트 라벨을 함께 제공한다.
- 제목 계층은 페이지당 하나의 대표 `h1`과 순차적인 `h2`, `h3`를 사용한다.
- 모든 필터에 명시적 label을 제공한다.
- 키보드만으로 날짜, 이슈, 기사 탐색이 가능해야 한다.
- 로딩 상태에는 `aria-live`를 적용하되 반복 알림을 방지한다.
- 애니메이션은 `prefers-reduced-motion`을 존중한다.

---

## 3. 구현 계획과 완료 기준

### 3.1 권장 작업 순서

#### 1단계: 데이터 품질 기반

- [ ] `article_analysis`, `issue_cluster`, `issue_impact` 저장 구조 추가
- [ ] 기존 기사 URL·출처·제목 정규화
- [ ] 관련도 분류기 구현
- [ ] 최근 7일 기사로 분류 결과 샘플 검수
- [ ] 클러스터링 구현 및 병합 오류 검수
- [ ] 기존 감성 평가와 신규 영향 평가 병행 저장

완료 조건:

- 수동 검수 세트에서 관련 없음 기사가 홈 핵심 이슈에 포함되지 않는다.
- 동일 파업·협약 기사가 각각 하나의 클러스터로 묶인다.
- 모든 영향 평가에 근거 문장과 기사 ID가 존재한다.

#### 2단계: 홈 개편

- [ ] `/api/home` 또는 동등한 서버 조회 함수 구현
- [ ] `LatestBriefingHero` 구현
- [ ] `IssueClusterCard` 구현
- [ ] `WatchNext` 구현
- [ ] 기사 탐색기를 보조 영역으로 이동
- [ ] 당일 준비 중일 때 직전 완료 브리핑 노출

완료 조건:

- 홈 최초 진입 화면에 빈 상세 패널이 없다.
- 사용자가 클릭하지 않아도 최신 완료 브리핑과 핵심 이슈 3개를 볼 수 있다.
- 동일 이슈의 기사 수와 출처 수가 카드에 정확히 표시된다.

#### 3단계: 검색 구조

- [ ] `/archive` 구현
- [ ] 완료 브리핑 전체를 사이트맵에 포함
- [ ] 준비 중 브리핑 사이트맵 제외 및 `noindex`
- [ ] 브리핑 title·description 생성 규칙 적용
- [ ] `BreadcrumbList` 추가
- [ ] 주제 페이지는 생성 조건 충족 시에만 공개

완료 조건:

- 사이트맵 URL과 실제 canonical이 일치한다.
- 기사 상세는 사이트맵에 포함되지 않는다.
- 아카이브에서 모든 완료 브리핑으로 정적 링크를 따라갈 수 있다.
- 구조화 데이터 검사에서 필수 속성 오류가 없다.

#### 4단계: 성능·운영

- [ ] 전체 날짜 트리 초기 직렬화 제거
- [ ] 반응형 중복 DOM 제거
- [ ] 페이지 유형별 캐시 정책 적용
- [ ] Core Web Vitals와 API 지연 계측
- [ ] 수집·분석·브리핑 실패 알림 추가

완료 조건:

- 홈 초기 데이터에 과거 전체 날짜 배열이 포함되지 않는다.
- 데스크톱과 모바일에서 동일 콘텐츠 DOM을 재사용한다.
- 캐시 적용 후에도 최신 기사와 준비 상태가 허용된 갱신 시간 내 반영된다.

### 3.2 테스트 시나리오

#### 기능

1. 당일 브리핑이 준비 중이면 직전 완료 브리핑이 홈에 표시된다.
2. 당일 브리핑이 완료되면 홈이 해당 브리핑으로 전환된다.
3. 같은 사건의 여러 기사 링크가 하나의 이슈 카드에 모인다.
4. `IRRELEVANT` 기사는 홈 핵심 이슈와 영향 통계에서 제외된다.
5. 이슈 카드의 대표 기사를 열면 올바른 상세 또는 원문으로 이동한다.
6. 과거 월을 펼치면 해당 월의 완료 브리핑 링크를 불러온다.

#### SEO

1. 홈·완료 브리핑은 200, self-canonical, `index, follow`다.
2. 준비 중 브리핑은 200, `noindex, follow`다.
3. 존재하지 않는 브리핑은 404다.
4. 기사 상세는 `noindex, follow`이며 사이트맵에 없다.
5. 완료 브리핑은 사이트맵과 아카이브 양쪽에서 발견된다.
6. title과 description이 날짜별로 고유하다.

#### 성능·접근성

1. JavaScript가 늦게 실행돼도 최신 완료 브리핑 요약이 HTML에 존재한다.
2. 작은 화면에서 가로 스크롤 없이 주요 내용을 읽을 수 있다.
3. 키보드로 모든 링크와 필터에 접근할 수 있다.
4. 긍정·부정·혼합 상태가 색상 없이도 구분된다.
5. 월별 아카이브 로딩 실패 시 재시도 또는 오류 안내가 표시된다.

### 3.3 출시 전략

1. 신규 관련도·클러스터·영향 분석을 기존 화면에 노출하지 않고 7일간 병행 생성한다.
2. 수동 검수로 오분류와 잘못된 병합 비율을 측정한다.
3. 내부 또는 제한된 비율로 신규 홈을 활성화한다.
4. 제품·성능·검색 지표에 이상이 없으면 전체 전환한다.
5. 기존 기사 탐색기는 최소 2주간 보조 경로로 유지한다.

### 3.4 최종 Definition of Done

- [ ] 홈 첫 화면이 최신 완료 브리핑과 핵심 이슈를 기본 제공한다.
- [ ] 중복 기사와 관련 없는 기사가 핵심 정보에서 제거된다.
- [ ] AI 평가는 대상, 기간, 근거를 설명한다.
- [ ] 완료 브리핑이 검색 색인의 주 대상이 된다.
- [ ] 사이트맵·canonical·robots 정책이 페이지 유형별로 일치한다.
- [ ] 전체 날짜 트리와 반응형 중복 DOM이 초기 응답에서 제거된다.
- [ ] 기능, SEO, 접근성, 성능 회귀 테스트가 자동화된다.
- [ ] 수집·분석·브리핑 실패를 운영자가 확인할 수 있다.

---

## 구현 시 판단이 필요한 항목

다음 값은 코드에 고정하지 말고 설정 또는 운영 데이터 검수로 확정한다.

- 관련도 confidence 기준값
- 제목 임베딩 클러스터 임계값
- 대표 기사 출처 우선순위
- 브리핑 자동 발행 최소 직접 관련 기사 수
- 주제 페이지 공개 최소 브리핑 수
- 홈과 준비 중 브리핑의 CDN 캐시 시간

기본 구현에서는 이 문서의 권장값을 사용하되, 최근 7일 실제 기사 샘플을 기준으로 조정한다.
