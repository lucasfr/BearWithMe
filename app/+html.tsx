import { ScrollViewStyleReset } from 'expo-router/html';

// This file controls the <head> content for the web build.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        {/* App-wide web overrides */}
        <link rel="stylesheet" href="/bwm.css" />

        {/* Primary meta */}
        <title>Bear with Me</title>
        <meta name="description" content="A quiet promise tracker for people who care deeply and sometimes struggle to follow through. No streaks. No shame. Just a record of trying." />

        {/* Open Graph — WhatsApp, Facebook, iMessage */}
        <meta property="og:type"        content="website" />
        <meta property="og:title"       content="Bear with Me 🐻" />
        <meta property="og:description" content="A quiet promise tracker for people who care deeply and sometimes struggle to follow through. You said you would. That already counts." />
        <meta property="og:image"       content="/og-image.png" />
        <meta property="og:image:width"  content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt"   content="Bear with Me — a quiet promise tracker" />

        {/* Twitter / X card */}
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content="Bear with Me 🐻" />
        <meta name="twitter:description" content="A quiet promise tracker for people who care deeply and sometimes struggle to follow through. You said you would. That already counts." />
        <meta name="twitter:image"       content="/og-image.png" />

        {/* iOS PWA — name and icon */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bear with Me" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Theme colour */}
        <meta name="theme-color" content="#6F4E37" />
        <meta name="msapplication-TileColor" content="#6F4E37" />

        {/* Scroll reset */}
        <ScrollViewStyleReset />

        {/* iOS PWA safe area + web input fixes */}
        <style>{`
          body {
            padding-top: env(safe-area-inset-top);
            padding-left: env(safe-area-inset-left);
            padding-right: env(safe-area-inset-right);
            background-color: #F5EFE6;
          }
          #root {
            height: 100vh;
            height: 100dvh;
          }
          /* Remove blue browser focus ring — use warm coffee glow */
          input:focus, textarea:focus, [contenteditable]:focus {
            outline: none !important;
            box-shadow: 0 0 0 2px rgba(111,78,55,0.35) !important;
            border-color: rgba(111,78,55,0.50) !important;
          }
          /* Prevent inputs from overflowing their containers */
          input, textarea {
            box-sizing: border-box !important;
            max-width: 100% !important;
            overflow: hidden !important;
            border-radius: inherit;
          }
          /* Date picker — override blue accent with coffee */
          input[type="date"] {
            accent-color: #6F4E37 !important;
            color-scheme: light;
          }
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: sepia(1) saturate(3) hue-rotate(330deg) brightness(0.6);
            cursor: pointer;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
