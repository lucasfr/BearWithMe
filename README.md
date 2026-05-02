# 🐻 Bear with Me

**A quiet, private, low-pressure promise tracker built for people who care and sometimes struggle to follow through.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Built with Expo](https://img.shields.io/badge/Built%20with-Expo-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.83-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

---

## 📖 What is Bear with Me?

Bear with Me is a promise tracker built for people whose executive function sometimes gets in the way of follow-through. Not because they don't care, but because their brain is just wired differently.

You log a promise, set how urgent it feels, and when you keep it, you grade it on two simple scales:

- 🐻 **How well** did you keep it?
- ❤️ **How did it feel** to follow through?

No streaks. No shame. Just a record of trying.

> *You said you would. That already counts.*

---

## ✨ Features

- **📝 Promise log** — add what you committed to, who you told, and how urgent it feels
- **🔥 Urgency scale** — drag the flame bar from a gentle nudge to a genuine deadline
- **📅 Specific dates** — pin promises to a date with a native date picker
- **✅ Grading** — when you keep a promise, rate it with 🐻 and ❤️ Likert bars
- **📆 Calendar view** — month grid with 🔥🐻❤️ indicators and filterable by type
- **📊 Report tab** — overview stats, trend chart, and urgency breakdown across 7d / 30d / all time
- **👤 Profile** — editable name greeting and lifetime stats
- **🌐 PWA ready** — installable as a web app with offline support via service worker
- **🎨 Warm glass UI** — dot grid background, BlurView surfaces, Libre Baskerville serif, coffee-brown palette

---

## 🗂️ Project Structure

```
bear-with-me/
├── app/
│   ├── _layout.tsx              # Root layout, fonts, custom splash screen
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab bar with custom SVG icons
│   │   ├── index.tsx            # Home — promise list, search, urgency filters
│   │   ├── calendar.tsx         # Month calendar with indicators and filters
│   │   ├── report.tsx           # Stats, trend chart, urgency breakdown
│   │   └── profile.tsx          # Name editor, stats grid, about
│   └── modals/
│       ├── add-promise.tsx      # Add / edit promise bottom sheet
│       └── grade-promise.tsx    # Grading sheet with drag-to-select Likert bars
├── storage/
│   ├── storage.ts               # AsyncStorage CRUD helpers
│   └── PromisesContext.tsx      # Global promise state (React Context)
├── theme/
│   ├── colours.ts               # Design colour tokens
│   ├── typography.ts            # Font tokens and sizes
│   └── modal.ts                 # Shared modal/sheet style tokens
├── types/
│   └── promise.ts               # Promise interface, UrgencyLevel, FuzzyDeadline
├── utils/
│   └── promise.ts               # ID generation, status computation, grouping
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── service-worker.js        # Offline-first caching
│   └── icons/                   # PWA icon variants
└── assets/
    ├── images/icon.png          # App icon (1024×1024)
    └── fonts/                   # Libre Baskerville + Source Sans 3
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 20
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- For iOS: Xcode with an iOS Simulator
- For Android: Android Studio with an emulator

### Installation

```bash
git clone https://github.com/lucasfr/BearWithMe.git
cd BearWithMe
npm install
```

### Run on iOS

```bash
npx expo run:ios
```

### Run on Android

```bash
npx expo run:android
```

### Build and run as PWA

```bash
npx expo export --platform web
npx serve dist
```

Open in Chrome — the install prompt will appear in the address bar.

---

## 🎨 Design System

| Token | Hex | Usage |
|-------|-----|-------|
| `coffee1` | `#6F4E37` | Primary — headings, active states, FAB |
| `coffee2` | `#A67B5B` | Secondary — labels, muted text |
| `coffee3` | `#ECB176` | Accent — medium urgency |
| `alert`   | `#C0614A` | Overdue, high urgency, ❤️ |
| `done`    | `#6A8FA0` | Kept promises |
| `bg`      | `#F5EFE6` | Warm cream background |

**Fonts:** Libre Baskerville (headings, italic display) · Source Sans 3 (body)

All modal surfaces share consistent tokens from `theme/modal.ts` — `MODAL_GLASS_BG`, `MODAL_CHIP_BG`, `MODAL_HANDLE`, `MODAL_SHEET` — ensuring visual consistency across every sheet and pop-up.

**Zelda visual language** — the urgency flame bar and grading screens borrow from the *Legend of Zelda* heart container system: icons packed tightly side by side, fading as the value decreases, filling left to right on tap or drag. Three flames for urgency. Five bears for how well. Five hearts for how it felt. Familiar, tactile, zero learning curve.

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~55 | Framework and build tooling |
| `expo-router` | ~55 | File-based navigation |
| `expo-blur` | ~55 | BlurView glass surfaces |
| `expo-splash-screen` | ~55 | Custom splash screen control |
| `@react-native-async-storage/async-storage` | 2.2.0 | Local promise persistence |
| `@react-native-community/datetimepicker` | latest | Native date picker |
| `react-native-svg` | 15.x | SVG icons and dot grid |
| `react-native-safe-area-context` | 5.x | Safe area insets |
| `@expo-google-fonts/libre-baskerville` | ^0.4 | Serif heading font |
| `@expo-google-fonts/source-sans-3` | ^0.4 | Body font |

---

## 👤 Author

**Lucas França** · [lfranca.uk](https://lfranca.uk)

---

## 📄 Licence

Released under the [MIT License](./LICENSE).

Copyright © Lucas França, 2026
