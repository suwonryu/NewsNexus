# 구글 색인 개선 점검 (2026-09-05)

목표: 검색 가치가 있는 공개 페이지의 실제 구글 색인 수를 늘린다.
사용자가 확인한 주요 미색인 상태는 `크롤링됨 - 현재 색인이 생성되지 않음`이다.
이 상태만으로 특정 품질 문제나 기술 오류를 단정할 수 없다.

## 확인한 운영 상태

- robots.txt는 전체 크롤링을 허용하고 sitemap.xml을 안내한다.
- 사이트맵 두 청크: 브리핑 643개, 기사 분석 25개, 주제 8개, 정적 페이지 3개.
- 전체 브리핑 API는 2024-07-12부터 2026-09-04까지 643개를 반환했다.
- API 아카이브 요약의 완전 일치는 0건, 제목의 중복 초과분은 1건이다. 의미상 유사도는 별도 점검이 필요하다.
- 2026-09-04 브리핑의 운영 HTML에는 고유 제목과 index, follow가 출력된다.
- Search Console 자체의 URL 검사, 마지막 크롤링 HTML 및 Google 선택 canonical은 아직 확인하지 못했다.

## 로컬 수정

- 아카이브 페이지마다 자기 URL을 canonical과 Open Graph URL로 사용한다.
- 아카이브와 브리핑 이전·다음 탐색에서 최근 12개월 제한을 제거했다.
- 범위 밖 페이지를 notFound 처리하고 metadata에 noindex를 지정한다.
- page=1과 비표준 숫자 표현은 정규 URL로 permanentRedirect 처리한다.
- Next.js 스트리밍 응답에서는 notFound/redirect가 HTTP 200 후 메타 태그로 전달될 수 있다.
- 상세 브리핑 본문에서 3문장 제한을 제거해 서버가 작성한 전체 요약을 표시한다.
- 실제 갱신 근거가 없는 홈/아카이브 lastmod를 제거했다.
- 사이트맵 전체 URL을 XML escape 처리한다.
- 최근 14일 기사 제한을 제거하고 `/sitemap/articles-YYYY-MM`으로 전체 READY 브리핑의 대표 분석을 월별로 탐색한다. 기존 숫자 사이트맵은 브리핑·주제·정적 URL을 유지한다.
- 월별 목록은 독립적으로 캐시하며, 사이트맵 인덱스 생성 시에는 기사 상세 조회를 하지 않는다. AI 생성 요청은 하지 않는다.
- 아카이브·브리핑·기사 API의 일시 장애는 사이트맵 경로에서 예외로 전파한다. 비어 있는 성공 응답을 캐시하지 않고 503, Cache-Control: no-store, Retry-After: 300을 반환한다. 기사 분석 404는 정상적인 비공개/미분석 상태로 제외한다.
- 2025-09-04의 기사 1756923000002747·1756923000002750, 2024-07-12의 기사 1720769546066011이 API상 indexable=true, sitemapEligible=true임을 확인했다. 기존 최근 14일 제한으로는 이 기사들을 사이트맵에서 찾을 수 없었다.

## 남은 작업

1. 실제 미색인 URL 2~3개를 Search Console의 마지막 크롤링 날짜, 크롤링 HTML, Google 선택 canonical과 대조한다.
2. 변경사항 배포 후 운영 HTML을 재검증한다. 이 점검 시점에는 배포하지 않았다.
3. 월별 사이트맵은 READY 브리핑의 featuredArticles를 후보로 사용하고 indexable/sitemapEligible을 확인한다. 브리핑에 연결되지 않은 공개 분석까지 포함하려면 백엔드의 전체 공개 분석 목록 API가 필요하다. 확인한 백엔드 컨트롤러에는 현재 해당 엔드포인트가 없다.
4. 초기 색인 수와 미색인 URL 표본을 기록하고 재크롤링 이후 변화를 비교한다. 사이트맵 URL 수를 실제 색인 수로 취급하지 않는다.

## 근거

- https://support.google.com/webmasters/answer/7440203?hl=en
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading

## 최종 로컬 검증

- `npm test`: 14개 통과. 과거 기사 포함, 월별 분리, 대표 기사 정책, 중복 제거, XML escaping, 잘못된 경로, API 장애와 404 구분을 검증했다.
- `npm run build`: 컴파일·타입·린트 통과.
- 프로덕션 서버 실행 후 실제 API로 `/sitemap.xml`: HTTP 200, 하위 사이트맵 29개 (일반 2개 + 기사 월별 27개), 약 2초.
- `/sitemap/0`, `/sitemap/1`: HTTP 200, 총 654개 URL (브리핑 643 + 주제 8 + 정적 3).
- `/sitemap/articles-2024-07`: HTTP 200, 기사 33개, 최종 실행 약 7.5초. 미캐시 첫 실행에서는 약 18.4초가 걸렸다.
- 위 수치는 사이트맵 노출 검증이며 실제 Google 색인 수가 아니다. 27개월 전체 기사 합계와 배포 환경의 실행 시간은 아직 검증하지 않았다.
