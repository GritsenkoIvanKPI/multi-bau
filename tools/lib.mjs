// Shared building blocks for the inner pages.
// Header, footer and the request form are copied from index.html, so every page stays in sync with the homepage.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
const home = readFileSync(ROOT + 'index.html', 'utf8');

const slice = (start, end) => {
  const a = home.indexOf(start);
  const b = home.indexOf(end, a) + end.length;
  if (a < 0 || b < end.length) throw new Error(`Cannot find ${start} in index.html`);
  return home.slice(a, b);
};

/* Relative homepage links → root-absolute, so they work from any folder */
const absolutize = (html) => html
  .replace(/(href|src)="\.\/"/g, '$1="/"')
  .replace(/(href|src)="(?!https?:|#|\/|mailto:|tel:|data:)([^"]+)"/g, '$1="/$2"');

const SPRITE = absolutize(slice('<svg width="0" height="0" class="sr-only"', '</svg>\n'));
const HEADER = absolutize(slice('<a class="skip-link"', '</header>'));
const FOOTER = absolutize(slice('<footer class="footer">', '</footer>'));
const FORM_SECTION = absolutize(slice('<section class="contact-cta" id="zayavka"', '</section>'));
export const CALC_SECTION = absolutize(slice('<form class="calc__grid" data-calc novalidate>', '</form>'));

/* Extra icons used only on inner pages */
const EXTRA_ICONS = `
    <symbol id="i-phone" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M27.5 22.4v3.6a2.4 2.4 0 0 1-2.6 2.4A23.8 23.8 0 0 1 3.6 7.1 2.4 2.4 0 0 1 6 4.5h3.6a2.4 2.4 0 0 1 2.4 2c.2 1.2.5 2.3.9 3.4a2.4 2.4 0 0 1-.5 2.5L10.8 14a19.2 19.2 0 0 0 7.2 7.2l1.6-1.6a2.4 2.4 0 0 1 2.5-.5c1.1.4 2.2.7 3.4.9a2.4 2.4 0 0 1 2 2.4z"/></symbol>
    <symbol id="i-mail" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7" width="25" height="18" rx="2"/><path d="m4.5 8.5 11.5 9 11.5-9"/></symbol>
    <symbol id="i-clock" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="12.5"/><path d="M16 9v7l4.5 3"/></symbol>
    <symbol id="i-ruler" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="26" height="10" rx="1.5"/><path d="M8 11v4M13 11v6M18 11v4M23 11v6"/></symbol>
    <symbol id="i-alert" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="12.5"/><path d="M16 9.5v8M16 22v.5"/></symbol>`;

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const icon = (id, cls = '') => `<svg${cls ? ` class="${cls}"` : ''} aria-hidden="true"><use href="#i-${id}"/></svg>`;
export const arrowLink = (href, text, light = false) => `<a class="arrow-link${light ? ' arrow-link--light' : ''}" href="${href}">
            <span class="arrow-link__icon">${icon('arrow')}</span>
            ${text}
          </a>`;

/* Mark the current section in the main menu */
const markCurrent = (html, path) => {
  const top = '/' + path.split('/').filter(Boolean)[0] + '/';
  return html.replace(new RegExp(`(<a class="nav-link" href="${top.replace(/\//g, '\\/')}")`), '$1 aria-current="page"');
};

/* Request form: same as the homepage, optionally with a different heading and a preselected service */
export const formSection = ({ title, service } = {}) => {
  let s = FORM_SECTION;
  if (title) s = s.replace(/(<h2 id="form-title">)[^<]*(<\/h2>)/, `$1${title}$2`);
  if (service) s = s.replace(`<option value="${service}">`, `<option value="${service}" selected>`);
  return s;
};

export const crumbs = (items) => `<nav class="crumbs mono" aria-label="Навігаційний ланцюжок">
          <ol>${items.map(([href, label], i) => i === items.length - 1
            ? `<li><span aria-current="page">${label}</span></li>`
            : `<li><a href="${href}">${label}</a></li>`).join('')}</ol>
        </nav>`;

/* Page hero: photo with a glass card, or a plain navy band for text pages */
export const pageHero = ({ crumbs: c, badge, title, lead, image, alt = '', actions = [], small = false }) => {
  const btns = actions.map((a, i) => `<a class="button${i === 0 ? ' button--light' : ' button--ghost'}" href="${a.href}">${a.label}</a>`).join('\n          ');
  if (!image) return `
    <section class="page-hero page-hero--plain" aria-labelledby="page-title">
      <div class="container page-hero__inner">
        ${crumbs(c)}
        <div class="page-hero__text" data-reveal>
          ${badge ? `<p class="badge">${badge}</p>` : ''}
          <h1 id="page-title">${title}</h1>
          ${lead ? `<p class="lead">${lead}</p>` : ''}
          ${btns ? `<div class="page-hero__actions">${btns}</div>` : ''}
        </div>
      </div>
    </section>`;
  return `
    <section class="page-hero${small ? ' page-hero--small' : ''}" aria-labelledby="page-title">
      <div class="page-hero__media"><img src="${image}" alt="${esc(alt)}" width="1600" height="900" fetchpriority="high"></div>
      <div class="container page-hero__inner">
        ${crumbs(c)}
        <div class="page-hero__card glass" data-reveal>
          ${badge ? `<p class="badge">${badge}</p>` : ''}
          <h1 id="page-title">${title}</h1>
          ${lead ? `<p class="lead">${lead}</p>` : ''}
          ${btns ? `<div class="page-hero__actions">${btns}</div>` : ''}
        </div>
      </div>
    </section>`;
};

export const faq = (items, { title = 'Часті запитання', badge = 'FAQ' } = {}) => `
    <section class="faq section" aria-labelledby="faq-title">
      <div class="container grid-2 faq__grid">
        <div data-reveal>
          <p class="badge">${badge}</p>
          <h2 id="faq-title">${title}</h2>
        </div>
        <div class="faq__list" data-reveal data-d="1">
          ${items.map(([q, a]) => `<details class="faq__item">
            <summary><span>${q}</span><span class="faq__icon" aria-hidden="true">${icon('plus')}</span></summary>
            <div class="faq__body"><p>${a}</p></div>
          </details>`).join('\n          ')}
        </div>
      </div>
    </section>`;

export const layout = ({ path, title, description, body, image = '/assets/img/hero.webp', schema }) => {
  const url = 'https://www.multibau-berlin.de' + path;
  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} | Multi Bau Berlin</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="uk_UA">
  <meta property="og:title" content="${esc(title)} | Multi Bau Berlin">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${image}">
  <meta name="theme-color" content="#1C385C">
  <link rel="icon" href="/assets/img/logo.svg" type="image/svg+xml">
  <link rel="preload" href="/assets/fonts/onest-cyrillic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/main.css">
  <script>document.documentElement.classList.add('js');</script>${schema ? `
  <script type="application/ld+json">${JSON.stringify(schema)}</script>` : ''}
</head>
<body class="inner-page">
  <!-- Згенеровано tools/build.mjs – редагуйте контент у tools/content.mjs, а не цей файл -->
  ${SPRITE.replace('</svg>', EXTRA_ICONS + '\n  </svg>')}
  ${markCurrent(HEADER, path)}

  <main id="main">${body}
  </main>

  ${FOOTER}

  <script src="/assets/js/main.js" defer></script>
</body>
</html>
`;
};
