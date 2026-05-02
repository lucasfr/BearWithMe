# Changelog

All notable changes to Bear with Me are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] — 2026-05-02

Initial release. 🐻

### Added

#### Core

- **Promise model** — `text`, `urgency` (0–3), `toWhom`, `fuzzyDeadline` (`none` / `this-week` / `this-month` / `specific`), `specificDate` (ISO `YYYY-MM-DD`), `context`, `status` (`pending` / `kept` / `overdue`), `scoreHowWell` (1–5), `scoreHowFelt` (1–5)
- **AsyncStorage persistence** — full CRUD via `storage.ts` and `PromisesContext` global state
- **Status computation** — automatic `overdue` detection based on deadline and current date

#### Screens

- **Home** — promise list grouped into Overdue / This week / Upcoming / Recently kept; collapsible sections; urgency filter chips (🔥 × 4 levels); sort toggle; search mode; bulk delete with confirmation; empty state
- **Calendar** — month grid (Monday-first); prev/next navigation; 🔥🐻❤️ day indicators with opacity scaled by score; today ring; tap-to-select day; day detail bottom sheet with promise cards and ✏️ edit button; filter chips (🔥 due / 🐻 kept / ❤️ felt / 📝 made) with independent filtering
- **Report** — time switcher (7d / 30d / All time); overview stats grid (made, kept, keep rate bar, bear avg, heart avg); SVG trend line chart with area fill; urgency breakdown bars; all computed live from promise data
- **Profile** — editable name greeting (persisted to AsyncStorage); stats grid (made / kept / pending / rate / how well avg / felt avg); Why this exists; How it works; The scales; Built with; MIT licence badge; link to lfranca.uk; easter egg (tap bear 7×)

#### Modals

- **Add / Edit promise** — `BlurView` bottom sheet; flame urgency `PanResponder` drag bar; to whom chips + free text; when chips (`no rush` / `this week` / `this month` / `specific`); `specific` activates native `DateTimePicker` spinner with date label row and collapsible picker; context field; edit mode pre-fills all fields
- **Grade promise** — drag-to-select `LikertBar` for 🐻 how well and ❤️ how it felt; celebration screen on completion; `CardActionSheet` long-press menu on home cards (mark done / edit / delete)

#### Design system

- **Palette** — `coffee1` `#6F4E37`, `coffee2` `#A67B5B`, `coffee3` `#ECB176`, `coffee4` `#FED8B1`, `alert` `#C0614A`, `done` `#6A8FA0`, `bg` `#F5EFE6`
- **Typography** — Libre Baskerville (heading, italic, bold) + Source Sans 3 (body, italic, bold)
- **Glass surfaces** — consistent `BlurView intensity={60} tint="light"` across all sheets and headers; shared tokens in `theme/modal.ts` (`MODAL_GLASS_BG`, `MODAL_CHIP_BG`, `MODAL_CHIP_SHADOW`, `MODAL_HANDLE`, `MODAL_SHEET`)
- **Dot grid** — SVG `Pattern` background throughout all screens
- **Custom splash screen** — dot grid + 🐻 + checkbox + *~~with me~~* in Libre Baskerville Italic, minimum 2s display via `expo-splash-screen`
- **Custom tab bar** — SVG icons (home, calendar, report, profile), coffee palette, glass background; web-aware bottom padding

#### PWA

- `public/manifest.json` — name, icons (192 × 512), `standalone` display, `#6F4E37` theme colour, `#F5EFE6` background
- `public/service-worker.js` — network-first caching strategy for offline support
- `app/+html.tsx` — `apple-mobile-web-app-capable`, `apple-touch-icon`, `apple-mobile-web-app-title`, `viewport-fit=cover`, safe area CSS
- `netlify.toml` — build command, publish dir, SPA redirect rule, `public/` copy step

#### Infrastructure

- Expo ~55, Expo Router (file-based), TypeScript throughout
- `@react-native-community/datetimepicker` for native date selection
- `react-native-svg` for icons, tab bar, dot grid, trend chart
- `generate-icons.js` — `sharp`-based icon generation from source PNG
- Deployed to Netlify via GitHub CI on every push to `main`

### Design decisions

- **No streaks** — removed from report and profile; streaks are toxic for neurodivergent users
- **✅ not ✓** — completion symbol uses ✅ throughout for warmth and clarity
- **Fuzzy deadlines** — `this-week` maps to end-of-week Sunday, `this-month` to last day of month on the calendar; free-text `specificDate` values are treated as fuzzy until the user sets a proper ISO date via the date picker
- **Two scales** — 🐻 how well you kept it and ❤️ how it felt are independent; grading both is encouraged but neither is required
- **Glass over dark** — modal backdrops use `rgba(44,26,14,0.45)` (warm dark) not cold black; all cards use warm cream `rgba(245,239,230,*)` family

---

*Bear with Me is open source under the MIT Licence. Built by someone who kept forgetting promises — not out of carelessness, but because the executive function just wasn't there.*
