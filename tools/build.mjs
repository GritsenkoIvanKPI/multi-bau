// Builds all inner pages into their folders (e.g. /leistungen/badsanierung/index.html).
// Run from the project root: node tools/build.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { ROOT, layout, pageHero, formSection, faq, icon, arrowLink, esc, CALC_SECTION, seoBlock } from './lib.mjs';
import { meta, blocks, stageSeo, stageH1 } from './seo.mjs';
import { services, projects } from './content.mjs';

const pages = [];
const page = (path, opts) => pages.push({ path, ...opts });

/* Real image sizes, so the browser reserves the right space */
const dims = (src) => {
  try {
    const out = execSync(`sips -g pixelWidth -g pixelHeight "${ROOT}${src.slice(1)}"`).toString();
    return { w: +out.match(/pixelWidth: (\d+)/)[1], h: +out.match(/pixelHeight: (\d+)/)[1] };
  } catch { return { w: 1200, h: 900 }; }
};
const img = (src, alt, extra = '') => { const { w, h } = dims(src); return `<img src="${src}" alt="${esc(alt)}" loading="lazy" width="${w}" height="${h}"${extra}>`; };

const HOME = ['/', 'Головна'];
const SERVICES_CRUMB = ['/#leistungen', 'Послуги'];
const delay = (i) => ['05', '15', '25', '35', '4', '55'][i % 6];

/* ---------- Reusable sections ---------- */
const introBlock = (s) => `
    <section class="section intro" aria-labelledby="intro-title">
      <div class="container grid-2">
        <div data-reveal>
          <p class="badge">Про послугу</p>
          <h2 id="intro-title">${s.introTitle}</h2>
        </div>
        <div class="intro__text" data-reveal data-d="1">
          ${s.intro.map((p) => `<p class="lead body-muted">${p}</p>`).join('\n          ')}
          <ul class="feature-list">
            <li class="feature-row"><span class="icon-square">${icon('team')}</span><p><strong>Одна команда</strong> на всі етапи – без перекладання відповідальності.</p></li>
            <li class="feature-row"><span class="icon-square">${icon('calendar')}</span><p><strong>Дата завершення в договорі</strong> – і ми здаємо об’єкт саме в цю дату.</p></li>
            <li class="feature-row"><span class="icon-square">${icon('shield')}</span><p><strong>Гарантія 5 років</strong> на всі виконані роботи.</p></li>
          </ul>
        </div>
      </div>
    </section>`;

const stageCards = (s, current) => `
        <ol class="stage-grid">
          ${s.stages.map((st, i) => `<li class="stage-card${st.slug === current ? ' is-current' : ''}" data-reveal data-d="${delay(i)}">
            <a href="/leistungen/${s.slug}/${st.slug}/"${st.slug === current ? ' aria-current="page"' : ''}>
              <span class="stage-card__media">${img(st.image, '')}</span>
              <span class="stage-card__body">
                <span class="mono stage-card__num">Етап ${String(i + 1).padStart(2, '0')}</span>
                <span class="stage-card__title">${st.name}</span>
                <span class="stage-card__text">${st.summary}</span>
              </span>
              <span class="stage-card__go" aria-hidden="true">${icon('arrow')}</span>
            </a>
          </li>`).join('\n          ')}
        </ol>`;

const optionsBlock = (s) => `
    <section class="why section section--alt" aria-labelledby="options-title">
      <div class="container">
        <h2 id="options-title" data-reveal>Опції, які роблять ${s.key === 'bad' ? 'ванну кімнату' : 'квартиру'} зручнішою.</h2>
        <div class="card-grid">
          ${s.options.map(([ic, t, p], i) => `<article class="why-card" data-reveal data-d="${delay(i)}">
            <span class="icon-square">${icon(ic)}</span>
            <div>
              <h3>${t}</h3>
              <p>${p}</p>
            </div>
          </article>`).join('\n          ')}
        </div>
      </div>
    </section>`;

const projectCard = (p, i) => `<a class="project-card" href="/portfolio/${p.slug}/" data-reveal data-d="${delay(i)}">
            ${img(p.image, p.alt)}
            <div class="project-card__panel glass">
              <div class="project-card__meta mono"><span>${services[p.service].name}<br>${p.district}</span>${icon('arrow-ne')}</div>
              <p class="project-card__title">${p.title}</p>
            </div>
          </a>`;

const projectsBlock = (list, title = 'Наші проєкти') => `
    <section class="projects section" aria-labelledby="projects-title">
      <div class="container">
        <div class="section-head" data-reveal>
          <div>
            <p class="badge">Портфоліо</p>
            <h2 id="projects-title">${title}</h2>
          </div>
          ${arrowLink('/portfolio/', 'Усі проєкти')}
        </div>
        <div class="card-grid card-grid--3">
          ${list.slice(0, 3).map(projectCard).join('\n          ')}
        </div>
      </div>
    </section>`;

const ctaBanner = ({ badge, title, href = '#zayavka', link = 'Залишити заявку', image = '/assets/img/cta.webp' }) => `
    <section class="cta-banner" aria-labelledby="banner-title">
      <div class="cta-banner__media">${img(image, '')}</div>
      <div class="container cta-banner__inner" data-reveal>
        <p class="badge">${badge}</p>
        <h2 id="banner-title">${title}</h2>
        ${arrowLink(href, link, true)}
      </div>
    </section>`;

const stepsBlock = () => `
    <section class="process section section--fade" aria-labelledby="process-title">
      <div class="container grid-2 process__grid">
        <div class="process__intro">
          <div data-reveal>
            <p class="badge">Як ми працюємо</p>
            <h2 id="process-title">Шість кроків від дзвінка до здачі об’єкта.</h2>
            <p class="lead body-muted">Кожен проєкт ведемо за чітким планом. Ви завжди знаєте, що відбувається зараз і що буде далі.</p>
          </div>
        </div>
        <div class="steps-wrap" data-steps>
          <div class="steps__track" aria-hidden="true"><span data-steps-progress></span></div>
          <ol class="steps">
            ${[
              ['Заявка', 'Залиште заявку через форму чи калькулятор або зателефонуйте нам.'],
              ['Безкоштовний огляд', 'Приїжджаємо на об’єкт, робимо заміри й обговорюємо побажання та бюджет.'],
              ['Детальний кошторис', 'Прозорий кошторис, у якому розписана кожна позиція.'],
              ['Договір із датою здачі', 'Фіксуємо обсяг робіт, вартість і дату завершення.'],
              ['Виконання робіт', 'Захищаємо приміщення від пилу й тримаємо вас у курсі на кожному етапі.'],
              ['Здача об’єкта', 'Приймаєте готовий і прибраний об’єкт у погоджену дату.'],
            ].map(([t, p], i) => `<li class="step" data-reveal>
              <span class="step__num mono">${String(i + 1).padStart(2, '0')}</span>
              <div><h3>${t}</h3><p>${p}</p></div>
            </li>`).join('\n            ')}
          </ol>
        </div>
      </div>
    </section>`;

/* ---------- Service overview pages ---------- */
for (const s of Object.values(services)) {
  const base = `/leistungen/${s.slug}/`;
  page(base, {
    title: s.name,
    description: s.description,
    image: s.image,
    schema: { '@context': 'https://schema.org', '@type': 'Service', name: s.name, provider: { '@type': 'HomeAndConstructionBusiness', name: 'Multi Bau Berlin' }, areaServed: 'Berlin' },
    body: `
    ${pageHero({ crumbs: [HOME, SERVICES_CRUMB, [base, s.name]], badge: 'Послуги', title: s.title, lead: s.lead, image: s.image, alt: s.alt,
      actions: [{ href: '#zayavka', label: 'Залишити заявку' }, { href: '/kalkulator/', label: 'Розрахувати вартість' }] })}
    ${introBlock(s)}

    <section class="section section--alt stages" aria-labelledby="stages-title">
      <div class="container">
        <div class="section-head" data-reveal>
          <div>
            <p class="badge">Етапи робіт</p>
            <h2 id="stages-title">${s.stagesTitle}</h2>
          </div>
          <p class="lead body-muted">Натисніть на етап, щоб дізнатися, що саме входить у роботи та яких стандартів ми дотримуємося.</p>
        </div>
        ${stageCards(s)}
      </div>
    </section>
    ${optionsBlock(s).replace('section--alt', '')}
    ${stepsBlock()}
    ${projectsBlock(projects.filter((p) => p.service === s.key).concat(projects.filter((p) => p.service !== s.key)), `Проєкти: ${s.short.toLowerCase()}`)}
    ${faq(s.faq)}
    ${formSection({ service: s.key })}`,
  });

  /* ---------- Stage pages ---------- */
  s.stages.forEach((st, i) => {
    const path = `${base}${st.slug}/`;
    const prev = s.stages[i - 1];
    const next = s.stages[i + 1];
    page(path, {
      title: `${st.name} – ${s.name.toLowerCase()}`,
      description: `${st.name} у межах послуги «${s.name}» у Берліні: ${st.includes.slice(0, 3).join(', ').toLowerCase()}. Гарантія 5 років.`,
      image: st.image,
      body: `
    ${pageHero({ crumbs: [HOME, [base, s.name], [path, st.name]], badge: `${s.name} · Етап ${String(i + 1).padStart(2, '0')}`, title: stageH1[path] || st.name, lead: st.lead, image: st.image, alt: st.alt, small: true,
      actions: [{ href: '#zayavka', label: 'Залишити заявку' }, { href: base, label: `Усі етапи` }] })}

    <section class="section includes" aria-labelledby="includes-title">
      <div class="container grid-2">
        <div data-reveal>
          <p class="badge">Що входить</p>
          <h2 id="includes-title">Роботи на цьому етапі.</h2>
          <p class="lead body-muted">${st.lead}</p>
          ${stageSeo[path] ? `<p class="includes__seo">${stageSeo[path]}</p>` : ''}
        </div>
        <ul class="check-list" data-reveal data-d="1">
          ${st.includes.map((t) => `<li><span class="check-list__icon">${icon('check')}</span><span>${t}</span></li>`).join('\n          ')}
        </ul>
      </div>
    </section>
${st.quality ? `
    <section class="section section--small quality" aria-labelledby="quality-title">
      <div class="container">
        <div data-reveal>
          <p class="badge">Класи якості</p>
          <h2 id="quality-title">Q1–Q4: яку поверхню ви отримаєте.</h2>
        </div>
        <ol class="quality-grid">
          ${st.quality.map(([q, t], k) => `<li class="quality-card" data-reveal data-d="${delay(k)}"><span class="quality-card__q">${q}</span><p>${t}</p><span class="quality-card__bar" aria-hidden="true"></span></li>`).join('\n          ')}
        </ol>
      </div>
    </section>` : ''}
    <section class="section section--alt standards" aria-labelledby="standards-title">
      <div class="container">
        <div class="section-head" data-reveal>
          <div>
            <p class="badge">Стандарти</p>
            <h2 id="standards-title">Як ми працюємо на цьому етапі.</h2>
          </div>
        </div>
        <div class="card-grid card-grid--3">
          ${st.standards.map(([ic, t, p], k) => `<article class="why-card why-card--compact" data-reveal data-d="${delay(k)}">
            <span class="icon-square">${icon(ic)}</span>
            <div><h3>${t}</h3><p>${p}</p></div>
          </article>`).join('\n          ')}
        </div>
        ${st.notice ? `<p class="notice" data-reveal>${icon('alert')}<span>${st.notice}</span></p>` : ''}
      </div>
    </section>

    <section class="section stage-nav" aria-labelledby="more-title">
      <div class="container">
        <nav class="pager" aria-label="Етапи">
          ${prev ? `<a class="pager__link pager__link--prev" href="${base}${prev.slug}/"><span class="mono">Попередній етап</span><span class="pager__title">${prev.name}</span>${icon('arrow')}</a>` : `<a class="pager__link pager__link--prev" href="${base}"><span class="mono">До послуги</span><span class="pager__title">${s.name}</span>${icon('arrow')}</a>`}
          ${next ? `<a class="pager__link pager__link--next" href="${base}${next.slug}/"><span class="mono">Наступний етап</span><span class="pager__title">${next.name}</span>${icon('arrow')}</a>` : `<a class="pager__link pager__link--next" href="/kalkulator/"><span class="mono">Що далі</span><span class="pager__title">Розрахувати вартість</span>${icon('arrow')}</a>`}
        </nav>
        <h2 id="more-title" class="stage-nav__title" data-reveal>Усі етапи: ${s.name.toLowerCase()}</h2>
        ${stageCards(s, st.slug)}
      </div>
    </section>
    ${formSection({ service: s.key })}`,
    });
  });
}

/* ---------- Про нас ---------- */
page('/ueber-uns/', {
  title: 'Про нас',
  description: 'Multi Bau Berlin – компанія з ремонту ванних кімнат і квартир у Берліні. Засновник має 8 років досвіду на будівництві в Німеччині, з них 4 роки – прорабом.',
  image: '/assets/img/about-team.webp',
  body: `
    ${pageHero({ crumbs: [HOME, ['/ueber-uns/', 'Про нас']], badge: 'Про нас', title: 'Будуємо так, як для себе.', lead: 'Multi Bau Berlin – команда, яка ремонтує ванні кімнати й квартири в Берліні та в радіусі 25 км. Без затримок і з датою завершення в договорі.', image: '/assets/img/about-team.webp', alt: 'Команда Multi Bau Berlin обговорює план робіт на об’єкті',
      actions: [{ href: '#zayavka', label: 'Залишити заявку' }, { href: '/portfolio/', label: 'Наші проєкти' }] })}

    <section class="story section" aria-labelledby="story-title">
      <div class="container grid-2">
        <div class="story__media story__media--portrait" data-reveal>
          ${img('/assets/img/about-founder.webp', 'Засновник Multi Bau Berlin на об’єкті')}
        </div>
        <div class="story__text">
          <div data-reveal data-d="1">
            <p class="badge">Наша історія</p>
            <h2 id="story-title">Від робітника до власної компанії.</h2>
            <div class="prose prose--lead">
              <p>Наш засновник переїхав до Німеччини 8 років тому. Починав звичайним робітником на будівництві, а згодом 4 роки працював прорабом – і за цей час пройшов кожен етап ремонту власними руками.</p>
              <p>Коли компанія, в якій він працював, збанкрутувала, він вирішив відкрити власну справу. Так з’явилася Multi Bau Berlin – компанія, у якій якість і дотримання строків стоять на першому місці.</p>
              <p>Його принцип простий: коли робота виконується якісно й відповідно до стандартів, клієнти повертаються самі й рекомендують нас друзям.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="stats section section--small" aria-label="Ключові цифри">
      <div class="container">
        <ul class="stats__grid">
          ${[['8', 'років досвіду засновника на будівництві в Німеччині'], ['4', 'роки – досвід роботи прорабом'], ['8', 'проєктів здали цього року – вчасно'], ['5', 'років гарантії на всі виконані роботи']]
            .map(([n, t], i) => `<li class="stat" data-reveal data-d="${delay(i)}"><span class="stat__num">${n}</span><span class="stat__text">${t}</span></li>`).join('\n          ')}
        </ul>
      </div>
    </section>
    ${ctaBanner({ badge: 'Наша філософія', title: 'Ваш дім – це не просто адреса. Це ваша візитівка і ваш комфорт.', image: '/assets/img/page-flat.webp' })}

    <section class="why section" aria-labelledby="values-title">
      <div class="container">
        <h2 id="values-title" data-reveal>Принципи, за якими ми працюємо.</h2>
        <div class="card-grid">
          ${[['calendar', 'Строки – це обіцянка', 'Дата завершення фіксується в договорі. Ми здаємо проєкт без затримок.'], ['document', 'Прозорий кошторис', 'Кожна позиція розписана заздалегідь. Без прихованих витрат.'], ['broom', 'Чистота на об’єкті', 'Захищаємо квартиру від пилу й щодня прибираємо за собою.'], ['shield', 'Гарантія 5 років', 'Працюємо за чинними нормами – і відповідаємо за результат.']]
            .map(([ic, t, p], i) => `<article class="why-card" data-reveal data-d="${delay(i)}"><span class="icon-square">${icon(ic)}</span><div><h3>${t}</h3><p>${p}</p></div></article>`).join('\n          ')}
        </div>
      </div>
    </section>

    <section class="section section--alt" aria-labelledby="clients-title">
      <div class="container grid-2">
        <div data-reveal>
          <p class="badge">Наші клієнти</p>
          <h2 id="clients-title">Для кого ми працюємо.</h2>
        </div>
        <ul class="feature-list" data-reveal data-d="1">
          <li class="feature-row"><span class="icon-square">${icon('team')}</span><p><strong>Сім’ї,</strong> які хочуть оновити ванну чи квартиру й не витрачати місяці на координацію бригад.</p></li>
          <li class="feature-row"><span class="icon-square">${icon('pin')}</span><p><strong>Власники квартир,</strong> які готують житло до продажу, оренди або власного заїзду.</p></li>
          <li class="feature-row"><span class="icon-square">${icon('layers')}</span><p><strong>Власники комерційних приміщень,</strong> яким важливі строки й мінімальний простій.</p></li>
        </ul>
      </div>
    </section>
    ${projectsBlock(projects, 'Наші останні роботи')}
    ${formSection()}`,
});

/* ---------- Контакти ---------- */
page('/kontakt/', {
  title: 'Контакти',
  description: 'Зв’яжіться з Multi Bau Berlin: телефон, e-mail і форма заявки. Безкоштовний огляд об’єкта в Берліні та в радіусі 25 км.',
  image: '/assets/img/contact.webp',
  body: `
    ${pageHero({ crumbs: [HOME, ['/kontakt/', 'Контакти']], badge: 'Контакти', title: 'Обговорімо ваш ремонт.', lead: 'Зателефонуйте, напишіть або залиште заявку – ми передзвонимо, проконсультуємо й домовимося про безкоштовний огляд.', image: '/assets/img/contact.webp', alt: 'Вулиця з відреставрованими альтбау в Берліні',
      actions: [{ href: 'tel:+493000000000', label: 'Зателефонувати' }, { href: '#zayavka', label: 'Залишити заявку' }] })}

    <!-- ЗАГЛУШКА: справжні контактні дані та години роботи -->
    <section class="section contacts" aria-labelledby="contacts-title">
      <div class="container">
        <h2 id="contacts-title" class="sr-only">Контактні дані</h2>
        <ul class="contact-cards">
          <li class="contact-card" data-reveal data-d="05"><span class="icon-square">${icon('phone')}</span><span class="mono">Телефон</span><a class="contact-card__value" href="tel:+493000000000">+49 30 000 000 00</a><span class="contact-card__note">Дзвінки та WhatsApp</span></li>
          <li class="contact-card" data-reveal data-d="15"><span class="icon-square">${icon('mail')}</span><span class="mono">E-mail</span><a class="contact-card__value" href="mailto:info@multibau-berlin.de">info@multibau-berlin.de</a><span class="contact-card__note">Відповідаємо протягом робочого дня</span></li>
          <li class="contact-card" data-reveal data-d="25"><span class="icon-square">${icon('clock')}</span><span class="mono">Години роботи</span><span class="contact-card__value">Пн–Пт, 8:00–18:00</span><span class="contact-card__note">Огляд можливий і в суботу</span></li>
          <li class="contact-card" data-reveal data-d="35"><span class="icon-square">${icon('pin')}</span><span class="mono">Район робіт</span><span class="contact-card__value">Берлін + 25 км</span><span class="contact-card__note">Усі райони міста та передмістя</span></li>
        </ul>
      </div>
    </section>

    <section class="section section--alt area" aria-labelledby="area-title">
      <div class="container grid-2">
        <div data-reveal>
          <p class="badge">Де ми працюємо</p>
          <h2 id="area-title">Берлін і передмістя в радіусі 25&nbsp;км.</h2>
          <p class="lead body-muted">Приїжджаємо на безкоштовний огляд у будь-який район Берліна, а також у Потсдам, Тельтов, Кляйнмахнов, Фалькензе, Бернау, Шенефельд та інші передмістя.</p>
        </div>
        <div class="area-map" data-reveal data-d="1" aria-hidden="true">
          <span class="area-map__ring area-map__ring--3"></span>
          <span class="area-map__ring area-map__ring--2"></span>
          <span class="area-map__ring area-map__ring--1"></span>
          <span class="area-map__center">${icon('pin')}<span class="mono">Берлін</span></span>
          <span class="area-map__label mono">25 км</span>
          <ul class="area-map__dots">${[['Потсдам', 18, 70], ['Фалькензе', 14, 34], ['Бернау', 72, 14], ['Шенефельд', 70, 76], ['Тельтов', 34, 82], ['Шпандау', 26, 46], ['Панков', 56, 26], ['Кепенік', 82, 60]]
            .map(([n]) => `<li class="area-map__dot"><i></i>${n}</li>`).join('')}</ul>
        </div>
      </div>
    </section>
    ${formSection({ title: 'Залиште заявку – ми передзвонимо.' })}`,
});

/* ---------- Калькулятор ---------- */
page('/kalkulator/', {
  title: 'Калькулятор вартості ремонту',
  description: 'Розрахуйте попередню вартість ремонту ванної кімнати або квартири в Берліні за хвилину. Точний кошторис – після безкоштовного огляду.',
  body: `
    ${pageHero({ crumbs: [HOME, ['/kalkulator/', 'Калькулятор']], badge: 'Калькулятор вартості', title: 'Дізнайтеся ціну ремонту за хвилину.', lead: 'Оберіть вид робіт, комплектацію, площу та рівень оздоблення – калькулятор покаже попередній діапазон цін.' })}

    <!-- ЗАГЛУШКА: ставки калькулятора (assets/js/main.js → CALC_RATES) – орієнтовні, замінити даними клієнта -->
    <section class="calc section section--alt" id="kalkulator" aria-label="Калькулятор">
      <div class="container">
        ${CALC_SECTION}
      </div>
    </section>

    <section class="section" aria-labelledby="how-title">
      <div class="container">
        <div class="section-head" data-reveal>
          <div>
            <p class="badge">Як рахуємо</p>
            <h2 id="how-title">Від чого залежить ціна.</h2>
          </div>
          <p class="lead body-muted">Калькулятор показує орієнтовний діапазон лише за роботи. Остаточну ціну фіксуємо в кошторисі після огляду.</p>
        </div>
        <div class="card-grid">
          ${[['ruler', 'Площа', 'Площа ванної кімнати або квартири – головний чинник обсягу робіт.'], ['layers', 'Комплектація', 'Душ чи ванна, косметичний чи капітальний ремонт – різний перелік робіт.'], ['document', 'Рівень оздоблення', 'Великоформатна плитка, складні примикання та класи якості Q3–Q4 потребують більше часу.'], ['clock', 'Стан об’єкта', 'Стан стін, труб і підлоги ми оцінюємо на огляді – він може змінити ціну в обидва боки.']]
            .map(([ic, t, p], i) => `<article class="why-card" data-reveal data-d="${delay(i)}"><span class="icon-square">${icon(ic)}</span><div><h3>${t}</h3><p>${p}</p></div></article>`).join('\n          ')}
        </div>
      </div>
    </section>
    ${faq([
      ['Наскільки точний розрахунок?', 'Калькулятор дає орієнтовний діапазон для типових умов. Точну вартість ми фіксуємо в кошторисі після безкоштовного огляду, і далі вона не змінюється без вашої згоди.'],
      ['Чи входять матеріали у вартість?', 'За замовчуванням – лише роботи. Якщо поставите позначку «Закупівля матеріалів нами», калькулятор врахує й орієнтовну вартість матеріалів.'],
      ['Скільки коштує огляд?', 'Огляд об’єкта в Берліні та в радіусі 25 км безкоштовний і ні до чого вас не зобов’язує.'],
      ['Що робити, якщо мого варіанту немає в калькуляторі?', 'Залиште заявку з коротким описом – ми передзвонимо й порахуємо індивідуально.'],
    ])}
    ${formSection()}`,
});

/* ---------- Документи ---------- */
const docs = [
  ['impressum', 'Вихідні дані (Impressum)', 'Дані про компанію згідно з § 5 DDG: назва, адреса, контакти, реєстраційні дані.', 'document'],
  ['datenschutz', 'Політика конфіденційності', 'Як ми обробляємо персональні дані відповідно до DSGVO (GDPR).', 'shield'],
  ['auftrag-reklamation', 'Замовлення та скарги', 'Форма для замовлення робіт і для подання рекламації за договором.', 'check'],
];
page('/dokumente/', {
  title: 'Документи',
  description: 'Документи Multi Bau Berlin: вихідні дані (Impressum), політика конфіденційності, форма замовлення та скарг.',
  body: `
    ${pageHero({ crumbs: [HOME, ['/dokumente/', 'Документи']], badge: 'Документи', title: 'Документи та правова інформація.', lead: 'Дані про компанію, політика конфіденційності та форма для замовлень і скарг.' })}

    <section class="section" aria-label="Документи">
      <div class="container">
        <ul class="doc-grid">
          ${docs.map(([slug, t, p, ic], i) => `<li data-reveal data-d="${delay(i)}">
            <a class="doc-card" href="/dokumente/${slug}/">
              <span class="icon-square">${icon(ic)}</span>
              <span class="doc-card__title">${t}</span>
              <span class="doc-card__text">${p}</span>
              <span class="doc-card__go mono">Відкрити ${icon('arrow')}</span>
            </a>
          </li>`).join('\n          ')}
        </ul>
      </div>
    </section>`,
});

const legal = (slug, title, content) => page(`/dokumente/${slug}/`, {
  title,
  description: `${title} – Multi Bau Berlin.`,
  body: `
    ${pageHero({ crumbs: [HOME, ['/dokumente/', 'Документи'], [`/dokumente/${slug}/`, title]], badge: 'Документи', title })}

    <section class="section legal" aria-label="${esc(title)}">
      <div class="container legal__grid">
        <aside class="legal__aside" data-reveal>
          <p class="mono">Інші документи</p>
          <ul>
            ${docs.map(([s, t]) => `<li><a href="/dokumente/${s}/"${s === slug ? ' aria-current="page"' : ''}>${t}</a></li>`).join('\n            ')}
          </ul>
        </aside>
        <article class="prose" data-reveal data-d="1">
          ${content}
        </article>
      </div>
    </section>`,
});

legal('impressum', 'Вихідні дані (Impressum)', `
          <!-- ЗАГЛУШКА: усі дані в [дужках] замінити реальними даними компанії; текст перевірити юристом -->
          <p class="prose__note">Обов’язкова інформація згідно з § 5 Digitale-Dienste-Gesetz (DDG). Юридично значущою є німецька редакція нижче.</p>
          <h2>Angaben gemäß § 5 DDG</h2>
          <p>Multi Bau Berlin<br>[Inhaber / Geschäftsführer: Vorname Nachname]<br>[Straße Hausnummer]<br>[PLZ] Berlin<br>Deutschland</p>
          <h2>Kontakt</h2>
          <p>Telefon: <a href="tel:+493000000000">+49 30 000 000 00</a><br>E-Mail: <a href="mailto:info@multibau-berlin.de">info@multibau-berlin.de</a></p>
          <h2>Registereintrag</h2>
          <p>[Eintragung im Handelsregister / Gewerberegister]<br>[Registergericht: Amtsgericht Berlin-Charlottenburg]<br>[Registernummer: HRB …]</p>
          <h2>Umsatzsteuer-ID</h2>
          <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: [DE …]</p>
          <h2>Handwerkskammer</h2>
          <p>[Zuständige Kammer: Handwerkskammer Berlin, Blücherstraße 68, 10961 Berlin]<br>[Eintragung in die Handwerksrolle: …]</p>
          <h2>Verbraucherstreitbeilegung</h2>
          <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
          <h2>Haftung für Inhalte und Links</h2>
          <p>Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte sowie für Inhalte externer Links übernehmen wir keine Gewähr. Für den Inhalt verlinkter Seiten sind ausschließlich deren Betreiber verantwortlich.</p>`);

legal('datenschutz', 'Політика конфіденційності', `
          <!-- ЗАГЛУШКА: текст-шаблон; перед запуском перевірити юристом і доповнити реальними даними та сервісами -->
          <p class="prose__note">Остання редакція: [дата]. Цей текст – шаблон; перед публікацією його має перевірити юрист.</p>
          <h2>1. Хто відповідає за обробку даних</h2>
          <p>Відповідальний за обробку персональних даних на цьому сайті (Verantwortlicher у значенні ст. 4 п. 7 DSGVO):<br>Multi Bau Berlin, [адреса], <a href="mailto:info@multibau-berlin.de">info@multibau-berlin.de</a>, <a href="tel:+493000000000">+49 30 000 000 00</a>.</p>
          <h2>2. Які дані ми обробляємо</h2>
          <ul>
            <li><strong>Дані із заявки:</strong> ім’я, телефон, e-mail, вид робіт і ваш опис завдання.</li>
            <li><strong>Технічні дані:</strong> IP-адреса, дата й час запиту, тип браузера – їх автоматично записує хостинг-провайдер.</li>
          </ul>
          <h2>3. Мета та правові підстави</h2>
          <p>Дані із заявки ми використовуємо лише для того, щоб зв’язатися з вами, підготувати кошторис і виконати договір (ст. 6 абз. 1 літ. b DSGVO). Технічні дані потрібні для стабільної та безпечної роботи сайту (ст. 6 абз. 1 літ. f DSGVO).</p>
          <h2>4. Скільки ми зберігаємо дані</h2>
          <p>Дані із заявок, які не завершилися договором, видаляємо через [6] місяців. Дані за договорами зберігаємо стільки, скільки вимагають податкові та торговельні норми (зазвичай 6–10 років).</p>
          <h2>5. Хостинг</h2>
          <p>Сайт розміщено в [Vercel Inc.]. Під час відвідування сайту провайдер обробляє технічні дані від нашого імені на підставі договору про обробку даних (ст. 28 DSGVO).</p>
          <h2>6. Відгуки Google</h2>
          <p>Посилання на наші відгуки веде на Google Maps. Дані передаються Google лише тоді, коли ви натискаєте на посилання.</p>
          <h2>7. Ваші права</h2>
          <p>Ви маєте право на доступ до своїх даних, їх виправлення, видалення, обмеження обробки, перенесення та заперечення проти обробки (ст. 15–21 DSGVO). Надану згоду можна будь-коли відкликати. Для цього напишіть нам на <a href="mailto:info@multibau-berlin.de">info@multibau-berlin.de</a>.</p>
          <h2>8. Право на скаргу</h2>
          <p>Ви можете подати скаргу до наглядового органу. У Берліні це Berliner Beauftragte für Datenschutz und Informationsfreiheit, Alt-Moabit 59–61, 10555 Berlin.</p>`);

legal('auftrag-reklamation', 'Замовлення та скарги', `
          <p class="lead body-muted">Через цю форму можна замовити роботи або подати рекламацію (скаргу) щодо виконаних робіт за договором. Ми відповімо протягом [2 робочих днів].</p>
          <h2>Як ми розглядаємо скарги</h2>
          <ol>
            <li>Ви описуєте проблему й за можливості додаєте номер договору.</li>
            <li>Ми зв’язуємося з вами та домовляємося про огляд.</li>
            <li>Якщо випадок гарантійний, усуваємо недолік безкоштовно – на роботи діє гарантія 5 років.</li>
          </ol>
          <!-- ЗАГЛУШКА: відправку форми потрібно підключити до бекенду / сервісу форм -->
          <form class="lead-form lead-form--inline" data-lead-form novalidate>
            <div class="lead-form__body">
              <h3>Форма звернення</h3>
              <fieldset class="calc__field">
                <legend class="mono">Тип звернення</legend>
                <div class="chips">
                  <label class="chip"><input type="radio" name="type" value="order" checked><span>Замовлення робіт</span></label>
                  <label class="chip"><input type="radio" name="type" value="complaint"><span>Скарга / рекламація</span></label>
                </div>
              </fieldset>
              <div class="form-grid">
                <div class="form-field"><label for="d-name">Ім’я *</label><input id="d-name" name="name" type="text" autocomplete="name" required><span class="form-error" data-error-for="name">Вкажіть, будь ласка, ваше ім’я</span></div>
                <div class="form-field"><label for="d-phone">Телефон *</label><input id="d-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required><span class="form-error" data-error-for="phone">Вкажіть коректний номер телефону</span></div>
                <div class="form-field"><label for="d-email">E-mail</label><input id="d-email" name="email" type="email" autocomplete="email"><span class="form-error" data-error-for="email">Перевірте адресу e-mail</span></div>
                <div class="form-field"><label for="d-contract">Номер договору</label><input id="d-contract" name="contract" type="text" placeholder="Якщо є"></div>
                <div class="form-field form-field--full"><label for="d-address">Адреса об’єкта</label><input id="d-address" name="address" type="text" autocomplete="street-address"></div>
                <div class="form-field form-field--full"><label for="d-message">Опис</label><textarea id="d-message" name="message" rows="4" placeholder="Що потрібно зробити або в чому проблема…"></textarea></div>
                <label class="check consent form-field--full"><input type="checkbox" name="consent" required><span>Я погоджуюся на обробку моїх даних відповідно до <a href="/dokumente/datenschutz/">Політики конфіденційності</a>. *</span></label>
                <span class="form-error form-field--full" data-error-for="consent">Потрібна ваша згода на обробку даних</span>
              </div>
              <button class="button button--block" type="submit">Надіслати звернення</button>
            </div>
            <div class="lead-form__success" role="status" tabindex="-1">
              <span class="icon-square">${icon('check')}</span>
              <h3>Дякуємо! Звернення отримано.</h3>
              <p>Ми зв’яжемося з вами протягом [2 робочих днів].</p>
            </div>
          </form>`);

/* ---------- Портфоліо ---------- */
page('/portfolio/', {
  title: 'Портфоліо',
  description: 'Проєкти Multi Bau Berlin: ремонт ванних кімнат і квартир у Берліні та околицях – фото до й після, обсяг робіт.',
  body: `
    ${pageHero({ crumbs: [HOME, ['/portfolio/', 'Портфоліо']], badge: 'Портфоліо', title: 'Проєкти в Берліні та околицях.', lead: 'Лише цього року ми здали 8 проєктів – вчасно й саме так, як було погоджено в договорі.' })}

    <!-- ЗАГЛУШКА: ілюстративні проєкти – замінити реальними фото й даними від клієнта -->
    <section class="section portfolio" aria-label="Проєкти">
      <div class="container">
        <ul class="portfolio-grid">
          ${projects.map((p, i) => `<li class="portfolio-item${i === 0 ? ' portfolio-item--lead' : ''}" data-reveal data-d="${delay(i)}">
            <a href="/portfolio/${p.slug}/">
              <span class="portfolio-item__media">${img(p.image, p.alt)}</span>
              <span class="portfolio-item__body">
                <span class="mono">${services[p.service].name} · ${p.district}</span>
                <span class="portfolio-item__title">${p.title}</span>
                <span class="portfolio-item__meta">${p.area} · ${p.rooms}</span>
              </span>
              <span class="portfolio-item__go" aria-hidden="true">${icon('arrow-ne')}</span>
            </a>
          </li>`).join('\n          ')}
        </ul>
      </div>
    </section>
    ${ctaBanner({ badge: 'Ваш проєкт', title: 'Хочете такий самий результат? Почнімо з безкоштовного огляду.' })}
    ${formSection()}`,
});

projects.forEach((p, i) => {
  const s = services[p.service];
  const next = projects[(i + 1) % projects.length];
  const path = `/portfolio/${p.slug}/`;
  page(path, {
    title: `${p.title} – ${p.district}`,
    description: `${s.name} у районі ${p.district}: ${p.task}`,
    image: p.image,
    body: `
    ${pageHero({ crumbs: [HOME, ['/portfolio/', 'Портфоліо'], [path, p.title]], badge: `${s.name} · ${p.district}`, title: p.title, lead: p.result, image: p.image, alt: p.alt, small: true })}

    <!-- ЗАГЛУШКА: ілюстративний проєкт – замінити реальними фото й даними від клієнта -->
    <section class="section section--small facts" aria-label="Коротко про проєкт">
      <div class="container">
        <dl class="facts__grid" data-reveal>
          <div><dt class="mono">Послуга</dt><dd><a href="/leistungen/${s.slug}/">${s.name}</a></dd></div>
          <div><dt class="mono">Район</dt><dd>${p.district}</dd></div>
          <div><dt class="mono">Площа</dt><dd>${p.area}</dd></div>
          <div><dt class="mono">Об’єкт</dt><dd>${p.rooms}</dd></div>
          <div><dt class="mono">Строк</dt><dd>Здано в дату з договору</dd></div>
        </dl>
      </div>
    </section>

    <section class="section ba" aria-labelledby="ba-title">
      <div class="container">
        <div class="section-head" data-reveal>
          <div>
            <p class="badge">До і після</p>
            <h2 id="ba-title">Що було і що стало.</h2>
          </div>
        </div>
        <div class="ba__grid">
          <figure class="ba__item" data-reveal data-d="05">${img(p.before, `${p.title}: до ремонту`)}<figcaption class="mono">До</figcaption></figure>
          <figure class="ba__item ba__item--after" data-reveal data-d="15">${img(p.image, `${p.title}: після ремонту`)}<figcaption class="mono">Після</figcaption></figure>
        </div>
      </div>
    </section>

    <section class="section section--alt" aria-labelledby="work-title">
      <div class="container grid-2">
        <div data-reveal>
          <p class="badge">Про проєкт</p>
          <h2 id="work-title">Завдання</h2>
          <p class="lead body-muted work__task">${p.task}</p>
        </div>
        <div data-reveal data-d="1">
          <p class="mono work__label">Що ми зробили</p>
          <ul class="check-list">
            ${p.done.map((t) => `<li><span class="check-list__icon">${icon('check')}</span><span>${t}</span></li>`).join('\n            ')}
          </ul>
          <p class="lead work__result"><strong>Результат:</strong> ${p.result}</p>
        </div>
      </div>
    </section>

    <section class="section" aria-label="Деталі">
      <div class="container">
        <div class="detail-grid">
          ${p.details.map(([src, cap], k) => `<figure class="detail" data-reveal data-d="${delay(k)}">${img(src, cap)}<figcaption>${cap}</figcaption></figure>`).join('\n          ')}
        </div>
        <a class="next-project" href="/portfolio/${next.slug}/" data-reveal>
          <span class="next-project__media">${img(next.image, '')}</span>
          <span class="next-project__body"><span class="mono">Наступний проєкт</span><span class="next-project__title">${next.title}</span><span class="mono next-project__meta">${services[next.service].name} · ${next.district}</span></span>
          <span class="arrow-link__icon" aria-hidden="true">${icon('arrow')}</span>
        </a>
      </div>
    </section>
    ${formSection({ service: p.service, title: 'Хочете так само? Розкажіть про ваш ремонт.' })}`,
  });
});

/* ---------- Write ---------- */
const SITE = 'https://www.multibau-berlin.de';
const strip = (h) => h.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
for (const p of pages) {
  /* SEO title/description and text block */
  if (meta[p.path]) Object.assign(p, meta[p.path]);
  if (blocks[p.path]) {
    const block = seoBlock(blocks[p.path]);
    p.body = p.body.includes('<section class="contact-cta"') ? p.body.replace('<section class="contact-cta"', block.trim() + '\n\n    <section class="contact-cta"') : p.body + block;
  }
  /* Structured data: breadcrumbs + FAQ */
  const schema = [].concat(p.schema || []);
  const nav = p.body.match(/<nav class="crumbs[\s\S]*?<\/nav>/);
  if (nav) {
    const items = [...nav[0].matchAll(/<li>(?:<a href="([^"]+)">|<span aria-current="page">)([^<]+)/g)];
    schema.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([, href, name], i) => ({ '@type': 'ListItem', position: i + 1, name: strip(name), item: SITE + (href || p.path) })) });
  }
  const qa = [...p.body.matchAll(/<summary><span>([^<]+)<\/span><span class="faq__icon"[\s\S]*?<div class="faq__body"><p>([\s\S]*?)<\/p>/g)];
  if (qa.length) schema.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa.map(([, q, a]) => ({ '@type': 'Question', name: strip(q), acceptedAnswer: { '@type': 'Answer', text: strip(a) } })) });
  p.schema = schema;

  const dir = ROOT + p.path.slice(1);
  mkdirSync(dir, { recursive: true });
  writeFileSync(dir + 'index.html', layout(p));
}

/* sitemap.xml + robots.txt */
const today = new Date().toISOString().slice(0, 10);
const urls = ['/', ...pages.map((p) => p.path)];
writeFileSync(ROOT + 'sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><priority>${u === '/' ? '1.0' : u.split('/').filter(Boolean).length === 2 || ['/kalkulator/', '/kontakt/'].includes(u) ? '0.8' : '0.6'}</priority></url>`).join('\n')}
</urlset>
`);
writeFileSync(ROOT + 'robots.txt', `User-agent: *
Allow: /
Disallow: /tools/

Sitemap: ${SITE}/sitemap.xml
`);
console.log(`Built ${pages.length} pages + sitemap.xml (${urls.length} URLs) + robots.txt`);
