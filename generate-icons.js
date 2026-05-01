#!/usr/bin/env node
// generate-icons.js — run from project root: node generate-icons.js
// Requires: npm install sharp

const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

const SRC        = path.join(__dirname, 'assets', 'images', 'icon.png');
const ICONS_DIR  = path.join(__dirname, 'assets', 'icons');
const IMAGES_DIR = path.join(__dirname, 'assets', 'images');

fs.mkdirSync(ICONS_DIR, { recursive: true });

async function png(size, dest) {
  await sharp(SRC).resize(size, size).png().toFile(dest);
  console.log(`✓ ${path.relative(__dirname, dest)} (${size}×${size})`);
}

async function run() {
  // Expo — adaptive icon (same as icon for now)
  await png(1024, path.join(IMAGES_DIR, 'adaptive-icon.png'));

  // favicon.ico (multi-size via sharp + manual ICO header)
  // sharp doesn't write .ico natively, so we write 3 PNGs and bundle them
  const icoSizes = [16, 32, 48];
  const icoBuffers = await Promise.all(
    icoSizes.map(s => sharp(SRC).resize(s, s).png().toBuffer())
  );
  fs.writeFileSync(path.join(ICONS_DIR, 'favicon-16.png'), icoBuffers[0]);
  fs.writeFileSync(path.join(ICONS_DIR, 'favicon-32.png'), icoBuffers[1]);
  fs.writeFileSync(path.join(ICONS_DIR, 'favicon-48.png'), icoBuffers[2]);
  console.log('✓ assets/icons/favicon-16/32/48.png (use these as fallbacks)');

  // Standard sizes
  const sizes = [16, 32, 48, 64, 128, 180, 192, 256, 512, 1024];
  for (const s of sizes) {
    await png(s, path.join(ICONS_DIR, `icon-${s}.png`));
  }

  // Named variants
  await png(180, path.join(ICONS_DIR, 'apple-touch-icon.png'));
  await png(192, path.join(ICONS_DIR, 'android-chrome-192x192.png'));
  await png(512, path.join(ICONS_DIR, 'android-chrome-512x512.png'));
  await png(1024, path.join(ICONS_DIR, 'ios-app-store.png'));

  console.log('\nAll done!');
  console.log('Next: npx expo prebuild --clean && npx expo run:ios');
}

run().catch(err => { console.error(err); process.exit(1); });
