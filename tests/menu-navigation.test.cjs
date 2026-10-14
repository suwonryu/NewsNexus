const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');

function loadPage(filename, dependencies) {
  const code = ts.transpileModule(readFileSync(path.resolve(__dirname, '..', filename), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  const mocks = {
    react: { ...React, cache: (fn) => fn },
    'next/link': { default: () => null },
    'next/navigation': { notFound: () => { throw new Error('NOT_FOUND'); }, permanentRedirect: () => { throw new Error('REDIRECT'); } },
    ...dependencies,
  };
  new Function('require', 'module', 'exports', code)((name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith('.')) throw new Error(`Unmocked dependency: ${name}`);
    return require(name);
  }, module, module.exports);
  return module.exports;
}

function findElements(node, predicate) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap((item) => findElements(item, predicate));
  return [...(predicate(node) ? [node] : []), ...findElements(node.props?.children, predicate)];
}

const deferred = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
};

function explorePage(getIssues, getHomeData) {
  return loadPage('app/explore/page.tsx', {
    '../../src/App': { default: () => null },
    '../../src/lib/koreaDate': { getKoreaIsoDate: () => '2026-10-14' },
    '../../src/services/articleServerApi': {},
    '../../src/services/home': { getIssues, getHomeData },
  });
}

test('explore renders its controls while issues are pending and skips unused home data', async () => {
  const issues = deferred();
  let homeCalls = 0;
  const page = explorePage(() => issues.promise, async () => { homeCalls++; throw new Error('unnecessary home request'); });
  const result = await page.default({ searchParams: Promise.resolve({}) });
  const shell = result.type(result.props);
  assert.equal(findElements(shell, (node) => node.type === 'form').length, 1);
  const boundary = findElements(shell, (node) => node.type === React.Suspense)[0];
  assert.ok(boundary.props.fallback);
  issues.resolve({ items: [{ id: 'issue', articles: [], articleCount: 1, sourceCount: 1 }] });
  const child = boundary.props.children;
  const rendered = await child.type(child.props);
  assert.equal(findElements(rendered, (node) => node.type === 'article').length, 1);
  assert.equal(homeCalls, 0);
});

test('explore retains the home fallback only for empty current direct issues', async () => {
  let homeCalls = 0;
  const page = explorePage(async () => ({ items: [] }), async () => { homeCalls++; return { topClusters: [{ id: 'fallback' }] }; });
  for (const params of [{}, { date: '2026-10-13' }, { relevance: 'INDUSTRY' }]) {
    const rendered = await page.default({ searchParams: Promise.resolve(params) });
    const clusters = await rendered.props.clusters;
    assert.equal(clusters.length, Object.keys(params).length === 0 ? 1 : 0);
  }
  assert.equal(homeCalls, 1);
});

test('ready briefing renders without waiting for supplemental APIs and reads without enqueueing', async () => {
  const options = [];
  const briefing = { date: '2026-10-13', status: 'READY', summary: '오늘의 요약', keywords: [],
    keywordDetails: [], featuredArticles: [], sourceNames: [], editorialAnalysis: null, generatedAt: null };
  const pending = () => new Promise(() => {});
  const page = loadPage('app/briefing/[date]/page.tsx', {
    '../../../src/components/BriefingArticleCard': { BriefingArticleCard: () => null },
    '../../../src/components/DailyBriefingCard': { default: () => null },
    '../../../src/lib/koreaDate': { getKoreaIsoDate: () => '2026-10-14' },
    '../../../src/lib/siteMetadata': { SITE_NAME: 'News', DEFAULT_OG_IMAGE: {}, DEFAULT_OG_IMAGE_PATH: '/og.png' },
    '../../../src/lib/siteUrl': { getSiteUrl: () => 'https://news.kabang.app' },
    '../../../src/services/articleServerApi': { getDailyBriefing: async (date, opts) => { options.push(opts); return briefing; } },
    '../../../src/services/briefingArchive': { getAllReadyBriefings: pending },
    '../../../src/services/contentPresentation': { normalizeEditorialText: (text) => text },
    '../../../src/services/topics': { getPublishedTopics: pending },
    '../../../src/services/home': { getHomeData: pending, getIssues: pending },
  });
  const args = { params: Promise.resolve({ date: briefing.date }) };
  const result = await page.default(args);
  const boundaries = findElements(result, (node) => node.type === React.Suspense);
  assert.equal(boundaries.length, 3);
  assert.ok(findElements(result, (node) => node.props?.briefing === briefing).length > 0);
  const metadata = await page.generateMetadata(args);
  assert.equal(metadata.robots.index, true);
  assert.ok(options.every((opts) => opts.enqueue === false && opts.throwOnError === true));
});

test('archive first-page metadata does not wait for the complete archive; later pages stay validated', async () => {
  let calls = 0;
  const page = loadPage('app/archive/page.tsx', {
    '../../src/lib/siteMetadata': { SITE_NAME: 'News', DEFAULT_OG_IMAGE: {} },
    '../../src/lib/siteUrl': { getSiteUrl: () => 'https://news.kabang.app' },
    '../../src/services/briefingArchive': { getAllReadyBriefings: async () => { calls++; return []; } },
  });
  const first = await page.generateMetadata({ searchParams: Promise.resolve({}) });
  assert.equal(first.alternates.canonical, '/archive');
  assert.equal(calls, 0);
  const invalid = await page.generateMetadata({ searchParams: Promise.resolve({ page: '2' }) });
  assert.equal(invalid.robots.index, false);
  assert.equal(calls, 1);
  await assert.rejects(page.default({ searchParams: Promise.resolve({ page: '2' }) }), /NOT_FOUND/);
});

test('archive first page renders its heading before the list arrives and keeps 24-item pagination', async () => {
  const archive = deferred();
  const page = loadPage('app/archive/page.tsx', {
    '../../src/lib/siteMetadata': { SITE_NAME: 'News', DEFAULT_OG_IMAGE: {} },
    '../../src/lib/siteUrl': { getSiteUrl: () => 'https://news.kabang.app' },
    '../../src/services/briefingArchive': { getAllReadyBriefings: () => archive.promise },
  });
  const shell = await page.default({ searchParams: Promise.resolve({}) });
  assert.equal(findElements(shell, (node) => node.type === 'h1').length, 1);
  const boundary = findElements(shell, (node) => node.type === React.Suspense)[0];
  assert.ok(boundary.props.fallback);
  const child = boundary.props.children;
  const contents = child.type(child.props);
  archive.resolve(Array.from({ length: 25 }, (_, i) => ({ date: `2026-10-${String(25 - i).padStart(2, '0')}`,
    headline: `브리핑 ${i}`, summary: '요약', topicTags: [] })));
  const rendered = await contents;
  const links = findElements(rendered, (node) => node.props?.href?.startsWith('/briefing/'));
  assert.equal(links.length, 24);
  const pagination = findElements(rendered, (node) => node.props?.pageCount === 2)[0];
  assert.equal(pagination.props.currentPage, 1);
});
