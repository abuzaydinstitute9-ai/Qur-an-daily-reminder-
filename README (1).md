# Abu Zayd Qur'an — Recitation & Da'wah Tools

A three-part static website: a Mushaf reader with a hand-controlled pointer,
full surah navigation, and a daily verse/hadith card generator for social
media. No build step — open the HTML files in a browser, or upload the
folder to GitHub Pages / any static host.

## Folder structure

```
abuzayd-quran/
  index.html          Home page
  reader.html          Mushaf reader with pointer + audio
  quran.html            Surah list / navigation
  daily.html            Daily verse & hadith card generator
  css/style.css         All styling (green + white brand)
  js/surah-data.js      List of all 114 surahs + starting pages
  js/reader.js            Reader page logic
  js/daily.js              Canvas card generator
  images/pages/          Put page001.jpg … page604.jpg here
  audio/                    Put page001.mp3 … page604.mp3 here
  assets/                    Logo / extra brand assets
```

Each page's header/footer is written directly into its HTML file
(not loaded from a shared script), so **every page works correctly
on its own** even if you open just that one file — nothing depends
on another file loading first.

## What you need to add before this is fully live

1. **Mushaf page images** — `images/pages/page001.jpg` through
   `page604.jpg`, one image per Mushaf page, Uthmani script (Madinah
   Mushaf print). Until an image exists for a page, the reader shows a
   labelled placeholder instead of a broken image, so the site never
   looks broken while you're still adding pages.
2. **Audio files** (optional, phase 1 does not require these) —
   `audio/page001.mp3` through `page604.mp3`, one recitation file per
   page, named to match the page number.
3. **Verify the surah page numbers** in `js/surah-data.js` against your
   own physical Mushaf. The numbers in the file follow the standard
   604-page Madinah Mushaf, but a few regional print runs shift by a
   page or two — check a handful of entries before you rely on it for
   exact jumps.

## Pointer behaviour

The pointer is a small marker the reciter controls directly — it never
moves on its own. You can:
- **Drag** it straight to any word on the page.
- **Tap/click** anywhere on the page to jump it there.
- **Nudge** it with the ← → (word, right-to-left) and ↑ ↓ (line)
  buttons, or the arrow keys.

Page turning is buttons-only (previous/next/jump-to-page) so that
tapping the page itself is always free for pointing, not turning
pages. There's a "Hide" checkbox if you'd rather record without the
marker showing at all.

## Growth roadmap

- **Phase 1 (this build):** page viewer, manual pointer, audio
  playback + recording, surah navigation, daily card generator.
- **Phase 2:** pre-designed card templates, saved card history, hadith
  collection browser.
- **Phase 3:** exact verse-level pointer mapping (instead of line
  estimates), user accounts, memorisation/recitation progress
  tracking.

## Full-quote guarantee on daily cards

The card generator never shortens what you type. It measures the full
Arabic text and translation first, then steps the font size down and,
if needed, grows the card taller (up to a tall 1080×2200 ceiling)
until everything fits — so a long ayah or a long hadith is always
shown whole rather than cut off.

## Content sources

- Qur'an text and translations: verify against [Quran.com](https://quran.com)
  or another certified Mushaf source before publishing anything drawn
  from this site.
- Hadith: use verified collections only (Sahih al-Bukhari, Sahih
  Muslim, etc.) and double-check the reference before sharing.

---
Powered by Abu Zayd Solutions · 2026
