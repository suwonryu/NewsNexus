const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

function loadPage(article) {
  const calls = [];
  const App = () => null;
  const mocks = {
    react: { cache: (fn) => fn },
    'next/navigation': { notFound: () => { throw new Error('NOT_FOUND'); } },
    '../../../src/App': { default: App },
    '../../../src/lib/koreaDate': { getKoreaIsoDate: () => '2026-10-14' },
    '../../../src/lib/siteMetadata': { SITE_NAME: 'News', DEFAULT_OG_IMAGE: {}, DEFAULT_OG_IMAGE_PATH: '/og.png' },
    '../../../src/lib/siteUrl': { getSiteUrl: () => 'https://news.kabang.app' },
    '../../../src/services/articleServerApi': {
      getArticleDetail: async (id, options) => { calls.push({ id, options }); return article; },
      getDateTree: async () => ({ years: [] }),
      getArticlesByDate: async () => { throw new Error('Article rendering must not wait for the list'); },
    },
  };
  const source = readFileSync(path.resolve(__dirname, '../app/news/[id]/page.tsx'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    (name) => Object.hasOwn(mocks, name) ? mocks[name] : require(name), module, module.exports,
  );
  return { ...module.exports, App, calls };
}

test('a deep article renders without fetching any preceding list pages', async () => {
  const article = { id: 42, title: '기사', link: 'https://example.com/news', summary: '내용',
    publishedDate: '2026-10-14', offset: 264, analysis: { indexable: true, matchedEntities: [] } };
  const page = loadPage(article);
  const rendered = await page.default({ params: Promise.resolve({ id: '42' }) });
  const app = rendered.props.children.find((child) => child.type === page.App);
  assert.equal(app.props.initialArticleDetail, article);
  assert.deepEqual(app.props.initialArticles.map((item) => item.id), [42]);
  assert.equal(app.props.deferInitialArticleList, true);
  const metadata = await page.generateMetadata({ params: Promise.resolve({ id: '42' }) });
  assert.equal(metadata.robots.index, true);
  assert.equal(metadata.alternates.canonical, 'https://news.kabang.app/news/42');
  assert.ok(page.calls.every((call) => call.options.throwOnError === true));
});

test('invalid and missing articles retain their not-found behavior', async () => {
  const page = loadPage(null);
  await assert.rejects(page.default({ params: Promise.resolve({ id: 'invalid' }) }), /NOT_FOUND/);
  assert.equal(page.calls.length, 0);
  await assert.rejects(page.default({ params: Promise.resolve({ id: '42' }) }), /NOT_FOUND/);
  const metadata = await page.generateMetadata({ params: Promise.resolve({ id: '42' }) });
  assert.equal(metadata.robots.index, false);
});
