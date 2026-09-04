const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

// Load the actual server adapters with isolated fetch/dependency mocks. No network or AI calls.
function loader(fetch, mocks = {}) {
  const cache = new Map();
  function load(filename) {
    const absolute = path.resolve(__dirname, '..', filename);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const module = { exports: {} };
    cache.set(absolute, module);
    const code = ts.transpileModule(readFileSync(absolute, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const localRequire = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('.')) return load(path.resolve(path.dirname(absolute), `${name}.ts`));
      return require(name);
    };
    new Function('require', 'module', 'exports', 'fetch', code)(localRequire, module, module.exports, fetch);
    return module.exports;
  }
  return load;
}

const ok = (body) => ({ ok: true, json: async () => body });
const date = '2026-09-04';
const issue = (id, title, priority, confidence) => ({
  id, title, summary: '백엔드에서 검증한 요약입니다.',
  topicSlug: 'earnings', editorialPriority: priority, impactConfidence: confidence,
  impactReason: '백엔드 근거', articleCount: 1, sourceCount: 1,
});

test('home preserves backend titles, order, confidence and recent article selection', async () => {
  const items = [issue('first', '실적 경쟁의 새로운 국면', 0.2, 0.91), issue('second', '파업 교섭', 0.9, 0.52)];
  const calls = [];
  const { getHomeData } = loader(async (url) => {
    calls.push(url);
    return ok({ today: date, todayStatus: 'READY', topClusters: items,
      latestReadyBriefing: { date, displayHeadline: '백엔드 확정 제목', displaySummary: '백엔드 확정 요약.' },
      recentArticles: [{ id: 1, title: '앱테크 서비스 분석', link: 'https://example.com/1', sourceName: 'example.com' }],
    });
  })('src/services/home.ts');
  const result = await getHomeData();
  assert.equal(calls.length, 1);
  assert.deepEqual(result.topClusters.map((item) => item.id), ['first', 'second']);
  assert.equal(result.topClusters[0].title, items[0].title);
  assert.equal(result.topClusters[0].topicSlug, 'earnings');
  assert.equal(result.topClusters[0].impactConfidence, 0.91);
  assert.equal(result.topClusters[0].impactReason, '백엔드 근거');
  assert.equal(result.latestReadyBriefing.displayHeadline, '백엔드 확정 제목');
  assert.equal(result.recentArticles[0].title, '앱테크 서비스 분석');
});

test('home failure does not fetch other APIs or synthesize a briefing', async () => {
  let calls = 0;
  const { getHomeData } = loader(async () => { calls++; throw new Error('offline'); })('src/services/home.ts');
  const result = await getHomeData();
  assert.equal(calls, 1);
  assert.equal(result.todayStatus, 'PREPARING');
  assert.equal(result.latestReadyBriefing, null);
  assert.deepEqual(result.topClusters, []);
  assert.deepEqual(result.recentArticles, []);
});

test('incomplete home briefing is hidden, not assigned an inferred title', async () => {
  const { getHomeData } = loader(async () => ok({ latestReadyBriefing: { date, displaySummary: '요약' } }))('src/services/home.ts');
  assert.equal((await getHomeData()).latestReadyBriefing, null);
});

test('issues are neither merged nor reranked by the client', async () => {
  const { getIssues } = loader(async () => ok({ items: [issue('a', '동일 제목', 0.1, 0.3), issue('b', '동일 제목', 0.9, 0.9)] }))('src/services/home.ts');
  assert.deepEqual((await getIssues(date)).items.map((item) => item.id), ['a', 'b']);
});

test('published topics do not require client keywords, description length or three dates', async () => {
  const topic = { slug: 'new-backend-topic', title: '새 주제', description: '설명', trendSummary: '서버가 작성한 추세',
    briefings: [{ date, headline: '실적 경쟁의 변화', issueTitle: '실적', issueSummary: '요약.' }] };
  const { getPublishedTopics } = loader(async () => ok([topic]))('src/services/topics.ts');
  assert.deepEqual(await getPublishedTopics(), [topic]);
});

test('archive retains backend content and scores without headline-based sentence filtering', async () => {
  const { getAllReadyBriefings } = loader(async () => ok([{ date, headline: '실적 경쟁의 변화',
    summary: '노사 협상이 이어졌습니다. 대출 수익성도 개선됐습니다.', qualityScore: 0.4 }]))('src/services/briefingArchive.ts');
  const [item] = await getAllReadyBriefings();
  assert.equal(item.summary, '노사 협상이 이어졌습니다. 대출 수익성도 개선됐습니다.');
  assert.equal(item.qualityScore, 0.4);
});

test('archive errors return empty results without generating replacement briefings', async () => {
  let calls = 0;
  const { getAllReadyBriefings } = loader(async () => { calls++; return { ok: false }; })('src/services/briefingArchive.ts');
  assert.deepEqual(await getAllReadyBriefings(), []);
  assert.equal(calls, 1);
});

test('daily briefing API failure remains PREPARING even for past dates', async () => {
  const { getDailyBriefing } = loader(async () => { throw new Error('offline'); })('src/services/articleServerApi.ts');
  const result = await getDailyBriefing(date, { enqueue: false });
  assert.equal(result.status, 'PREPARING');
  assert.equal(result.summary, null);
  assert.deepEqual(result.keywords, []);
  assert.deepEqual(result.featuredArticles, []);
});

test('malformed or wrong-date READY response is not published', async () => {
  for (const body of [{ date, status: 'READY', summary: '' }, { date: '2026-09-03', status: 'READY', summary: '다른 날짜' }]) {
    const { getDailyBriefing } = loader(async () => ok(body))('src/services/articleServerApi.ts');
    assert.equal((await getDailyBriefing(date, { enqueue: false })).status, 'PREPARING');
  }
});

test('sitemap uses backend representative flags instead of highest client score', async () => {
  const articles = [
    { id: 1, analysis: { indexable: true, sitemapEligible: true, editorialPriority: 0.1, clusterId: 'same' } },
    { id: 2, analysis: { indexable: true, sitemapEligible: false, editorialPriority: 0.9, clusterId: 'same' } },
    { id: 3, analysis: { editorialPriority: 1 } },
  ];
  const { getSitemapEntries } = loader(async () => { throw new Error('Unexpected network call'); }, {
    'next/cache': { unstable_cache: (fn) => fn },
    './articleServerApi': {
      getDailyBriefing: async () => ({ date, status: 'READY', featuredArticles: articles }),
      getArticleDetail: async (id) => articles.find((article) => article.id === id),
    },
    './briefingArchive': { getAllReadyBriefings: async () => [] },
    './topics': { getPublishedTopics: async () => [] },
  })('src/services/sitemapService.ts');
  assert.deepEqual((await getSitemapEntries()).filter((item) => item.path.startsWith('/news/')).map((item) => item.path), ['/news/1']);
});
