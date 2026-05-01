# 🐻 Bear with Me

**A quiet, low-pressure promise tracker for people who care deeply and sometimes struggle to follow through.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Built with Expo](https://img.shields.io/badge/Built%20with-Expo-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.83-61DAFB?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)

---

## 📖 What is Bear with Me?

Bear with Me is an autism-inspired promise tracker built for people whose executive function sometimes gets in the way of follow-through — not because they don't care, but because their brain is just wired differently.

You log a promise, set how urgent it feels, and when you keep it, you grade it on two scales:

- 🐻 **How well** did you keep it?
- ❤️ **How did it feel** to follow through?

No streaks. No shame. Just a record of trying.

---

## ✨ Features

- **📝 Promise log** — add what you committed to, who you told, and how urgent it feels
- **🔥 Urgency scale** — drag the flame bar from a gentle nudge to a genuine deadline
- **📅 Specific dates** — pin promises to a date with a native date picker
- **✅ Grading** — when you keep a promise, rate how well you kept it and how it felt
- **📆 Calendar view** — see promises and kept entries across a month grid with 🔥🐻❤️ indicators
- **📊 Report tab** — overview stats, trend chart, and urgency breakdown across 7d / 30d / all time
- **👤 Profile** — editable name greeting and lifetime stats
- **🌐 PWA ready** — installable as a web app with offline support
- **🎨 Warm glass UI** — dot grid, BlurView surfaces, Libre Baskerville serif, coffee palette

---

## 🗂️ Project Structure

```
bear-with-me/
├── app/
│   ├── _layout.tsx              # Root layout, fonts, custom splash screen
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab bar
│   │   ├── index.tsx            # Home — promise list, search, bulk delete
│   │   ├── calendar.tsx         # Month calendar with indicators and filters
│   │   ├── report.tsx           # Stats, trend chart, urgency breakdown
│   │   └── profile.tsx          # Name editor, stats grid, about
│   └── modals/
│       ├── add-promise.tsx      # Add + edit promise sheet
│       └── grade-promise.tsx    # Grading sheet with Likert bars
├── storage/
│   ├── storage.ts               # AsyncStorage CRUD
│   └── PromisesContext.tsx      # Global state
├── theme/
│   ├── colours.ts               # Design tokens
│   ├── typography.ts            # Font tokens and sizes
│   └── modal.ts                 # Shared modal/sheet style tokens
├── types/
│   └── promise.ts               # Promise interface and enums
├── utils/
│   └── promise.ts               # ID generation, status computation, grouping
├── public/
│   ├── manifest.json            # PWA manifest
│   └── service-worker.js        # Offline caching
└── assets/
    ├── images/icon.png          # App icon
    └── fonts/                   # Libre Baskerville + Source Sans 3
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 20
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator (Xcode) or Android emulator, or a physical device with Expo Go

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

### Run as PWA (web)

```bash
npx expo export --platform web
npx serve dist
```

Then open in Chrome and use the install prompt in the address bar.

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `coffee1` | `#6F4E37` | Primary — headings, active states, FAB |
| `coffee2` | `#A67B5B` | Secondary — labels, muted text |
| `coffee3` | `#ECB176` | Accent — medium urgency |
| `coffee4` | `#FED8B1` | Light accent |
| `alert`   | `#C0614A` | Overdue, high urgency, heart |
| `done`    | `#6A8FA0` | Kept promises |
| `bg`      | `#F5EFE6` | Warm cream background |

Fonts: **Libre Baskerville** (headings, italic) + **Source Sans 3** (body)

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `expo` ~55 | Framework |
| `expo-router` ~55 | File-based navigation |
| `expo-blur` | BlurView glass surfaces |
| `expo-splash-screen` | Custom splash control |
| `@react-native-async-storage/async-storage` | Local promise storage |
| `@react-native-community/datetimepicker` | Native date picker |
| `react-native-svg` | Icons and dot grid |
| `react-native-safe-area-context` | Safe area insets |
| `@expo-google-fonts/libre-baskerville` | Serif heading font |
| `@expo-google-fonts/source-sans-3` | Body font |

---

## 👤 Author

**Lucas França** — [lfranca.uk](https://lfranca.uk)

---

## 📄 Licence

Released under the [MIT License](./LICENSE).

Copyright © Lucas França, 2026
