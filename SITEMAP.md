# Multi Bau Berlin — Sitemap

Status: ✅ built · ⏳ planned (already linked from nav/footer on the homepage)

```
/                                   ✅ Головна (index.html, hand-written) · German version kept as index.de.html
/leistungen/badsanierung/           ✅ Ремонт ванної кімнати
    demontage-entsorgung/ · sanitaer-rohinstallation/ · untergrund-vorbereitung/ · fliesenarbeiten/ · endmontage/   ✅
/leistungen/wohnungsrenovierung/    ✅ Ремонт квартири
    demontage-entsorgung/ · trockenbau/ · elektroarbeiten/ · spachtel-malerarbeiten/ · montagearbeiten/   ✅
/ueber-uns/                         ✅ Про нас
/kontakt/                           ✅ Контакти
/kalkulator/                        ✅ Калькулятор (rates still placeholders)
/dokumente/                         ✅ Документи
    impressum/ · datenschutz/ · auftrag-reklamation/   ✅ (legal texts are templates – lawyer must review)
/portfolio/                         ✅ Портфоліо
    kvartyra-pid-klyuch/ · klasychna-vanna-altbau/ · dushova-z-trapom/ · kvartyra-novobudova/ · dush-u-riven-pidlogy/   ✅
```

## How inner pages are built
All pages except the homepage are generated: edit text in `tools/content.mjs` (services, stages, projects)
or page layouts in `tools/build.mjs`, then run `node tools/build.mjs`.
Header, footer and the request form are copied from `index.html` on every build, so change them there first.
Floor, painting and plumbing services were dropped from the site.


## Placeholders to replace before launch
- Phone `+49 30 000 000 00`, email `info@multibau-berlin.de`, domain in `<link rel=canonical>` / JSON-LD
- Google review on the homepage (sample text) → real Google Reviews widget (needs consent banner)
- Project cards (titles, districts, photos) → real projects / before-after photos from client
- All photos are AI-generated (Gemini) → replace with real project photos
- Portfolio projects (titles, districts, areas, before/after) are illustrative
- Impressum data in [brackets], Datenschutz template, contact hours, «call within one working day» → confirm
- "8 Projekte in diesem Jahr" → confirm figure
- Calculator rates in `assets/js/main.js` → `CALC_RATES` (placeholder €/m², work only) → replace with client's pricing
- Feedback form has no backend yet (shows success state only) → connect to email/form service
- Gallery photos, titles and districts are illustrative; 4 of 5 testimonials are sample text

## Homepage section order (UA, index.html)
Header · Hero (+ promise strip) · Services · Calculator · Gallery · How we work · Testimonials · Feedback form · Footer
