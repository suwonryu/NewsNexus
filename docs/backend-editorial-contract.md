# 백엔드 편집 정책 전환

프런트는 API가 확정한 콘텐츠를 표시한다. 기사 내용에 대한 단어 매칭, 주제 재분류,
이슈 병합·재정렬, 신뢰도 보정, 제목·요약 추론은 하지 않는다.
`contentPresentation.ts`에는 문장 표시 형식과 코드의 한글 라벨만 둔다.

## API 책임

- `GET /v2/kabang/home`: 공개 가능한 이슈를 서버 순서로 반환한다.
  `latestReadyBriefing.displayHeadline`과 `displaySummary`는 같은 생성 결과의 쌍이다.
  `recentArticles`는 서버가 선별한 오늘의 최근 기사 목록이다.
- `GET /v2/kabang/issues`: 응답의 제목, 주제, 영향, 신뢰도, 순서를 그대로 사용한다.
- `GET /v2/kabang/topics`: 반환된 목록이 공개 가능한 주제 목록이다.
  프런트에는 주제 허용 목록이나 공개 임계값을 두지 않는다.
- `GET /v2/kabang/briefings`: 홈과 동일한 백엔드 표시 정책으로 제목·요약을 반환한다.
  생성된 캐시가 완전하지 않으면 저장된 백엔드 제목·요약 쌍을 사용하며 서로 섞지 않는다.
  아카이브 캐시는 Redis 일괄 조회로 읽고 AI 재생성을 요청하지 않는다.
- `GET /v2/kabang/analysis/articles/{id}`: `indexable`이 기사 페이지의 검색 색인 여부다.
  `sitemapEligible`은 백엔드 대표 기사 여부까지 반영한 사이트맵 포함 기준이다.
  필드가 없으면 허용으로 추정하지 않는다.

## 장애 시 동작

홈·브리핑 조회 실패는 준비 상태, 아카이브·주제 조회 실패는 빈 목록으로 표시한다.
다른 날짜의 기사나 로컬 예시 데이터를 조합해 완료 브리핑을 만들지 않는다.
필수 제목·요약이 없거나 요청 날짜와 다른 브리핑도 공개하지 않는다.

## 배포 순서

1. `suwon_bot` 백엔드를 먼저 배포한다. 이번 변경 자체에는 DB 마이그레이션이나 AI 재분석이 필요 없다.
2. `/home`의 `recentArticles`, 기사 분석 API의 `indexable`·`sitemapEligible`,
   홈과 아카이브의 동일 날짜 제목·요약을 확인한다.
3. 이 프런트를 배포한다. 새 필드가 없는 구 백엔드에서는 최근 기사 목록이 비고 기사 색인이 비활성화된다.
4. 홈 캐시(60초), 기사 분석 캐시(300초), 아카이브·사이트맵 캐시(기본 1800초)를 고려해 확인한다.

## 회귀 검증

- 프런트: `npm test`, `npm run build`
- 백엔드: `./gradlew test -PrunTests --tests '*NewsHomeServiceTest' --tests '*NewsEditorialPolicyTest' --tests '*KabangNewsAnalysisControllerTest' --tests '*NewsPublicationPolicyTest' --tests '*NewsBriefingPresentationServiceTest' --tests '*DailyBriefingRedisBatchTest'`

`경쟁의` 같은 부분 문자열, 새로운 서버 주제, 서버 순서와 점수의 유지,
빈 응답·API 장애, 제목·요약 쌍의 일관성, 서버 대표 기사 선택을 검증한다.
