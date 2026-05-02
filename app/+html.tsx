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

        {/* iOS PWA safe area */}
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
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
