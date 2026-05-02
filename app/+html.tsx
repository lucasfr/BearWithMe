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
