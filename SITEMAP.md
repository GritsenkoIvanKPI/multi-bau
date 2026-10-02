# Multi Bau Berlin — Sitemap

Status: ✅ built · ⏳ planned (already linked from nav/footer on the homepage)

```
/                                   ✅ Головна (index.html, українською) · German version kept as index.de.html
/leistungen/badsanierung/                    ⏳
    demontage-entsorgung/                    ⏳ Demontage & Entsorgung (incl. Schutz-/Vorbereitungsarbeiten)
    sanitaer-rohinstallation/                ⏳ Sanitär-Rohinstallation (Wasserpunkte, Vorwand, opt. bodengleiche Dusche)
    untergrund-vorbereitung/                 ⏳ Untergrund & Vorbereitung (Putz, Wände/Boden ausgleichen, opt. Trockenbau/Spanndecke)
    fliesenarbeiten/                         ⏳ Abdichtung & Fliesen (Fuge/Epoxid, Silikon)
    endmontage/                              ⏳ Endmontage Sanitär (Waschtisch nach Körpergröße, Spiegel, WC/Bidet/Wanne, Dusche)
/leistungen/wohnungsrenovierung/             ⏳
    demontage-entsorgung/                    ⏳
    trockenbau/                              ⏳ Wände, Decken, Vorsatzschalen, Wärme-/Schalldämmung
    elektroarbeiten/                         ⏳ Planung, Schlitze, Kabelwege, Dosen — Hinweis: Anschluss durch Elektro-Fachbetrieb
    spachtel-malerarbeiten/                  ⏳ Q1–Q4, Anstrich, Tapeten — Hinweis: Partnerbetriebe bei Zulassungspflicht
    montagearbeiten/                         ⏳ Böden, Türen, Fensterbänke, Parkett, Sockelleisten
/leistungen/bodenarbeiten/                   ⏳
    vinyl-laminat/ · parkett/ · estrich-ausgleich/ · sockelleisten/
/leistungen/malerarbeiten/                   ⏳
    untergrundvorbereitung/ · spachteln-q1-q4/ · wand-deckenanstrich/ · tapezierarbeiten/
/leistungen/sanitaerarbeiten/                ⏳
    wasserleitungen/ · bodengleiche-dusche/ · fussbodenheizung/ · badkeramik-armaturen/
/ueber-uns/                                  ⏳
/kontakt/                                    ⏳
/kalkulator/                                 ⏳ (waiting for pricing parameters from client)
/dokumente/                                  ⏳
    impressum/ · datenschutz/ · auftrag-reklamation/
```

Subpages for Boden-, Maler- and Sanitärarbeiten are proposals; the brief only details Bad and Wohnung.

## Placeholders to replace before launch
- Phone `+49 30 000 000 00`, email `info@multibau-berlin.de`, domain in `<link rel=canonical>` / JSON-LD
- Google review on the homepage (sample text) → real Google Reviews widget (needs consent banner)
- Project cards (titles, districts, photos) → real projects / before-after photos from client
- Team avatars in hero (AI-generated) → real photos
- "8 Projekte in diesem Jahr" → confirm figure
- Calculator rates in `assets/js/main.js` → `CALC_RATES` (placeholder €/m², work only) → replace with client's pricing
- Feedback form has no backend yet (shows success state only) → connect to email/form service
- Gallery photos, titles and districts are illustrative; 4 of 5 testimonials are sample text

## Homepage section order (UA, index.html)
Header · Hero (+ promise strip) · Services · Calculator · Gallery · How we work · Testimonials · Feedback form · Footer
