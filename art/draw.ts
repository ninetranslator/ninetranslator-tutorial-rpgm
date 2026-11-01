// Draws the tutorial game's pictures: opens art/paint.js in a headless browser and writes what it
// paints into assets/. Run it when the art changes, and commit the pictures.
//
//     npm run art      (needs Chromium: npx playwright install chromium)

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { MAPS } from '../layout.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..');
const OUT = resolve(HERE, '..', 'assets');

const dataUrl = (path: string, type: string) => `data:${type};base64,${readFileSync(path).toString('base64')}`;
const nunito = dataUrl(join(REPO, 'node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2'), 'font/woff2');

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><style>@font-face{font-family:Nunito;src:url(${nunito}) format('woff2');font-weight:200 1000}</style>`);
  await page.addScriptTag({ path: join(HERE, 'paint.js') });
  const pictures = await page.evaluate(
    (args) => (window as unknown as { paintAll: (a: typeof args) => Promise<Record<string, string>> }).paintAll(args),
    {
      layouts: MAPS,
      logo: dataUrl(join(REPO, 'web/public/brand/cat-480.png'), 'image/png'),
      coin: dataUrl(join(REPO, 'web/public/brand/gold.png'), 'image/png'),
    },
  );
  for (const [path, url] of Object.entries(pictures)) {
    const file = join(OUT, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
  }
  console.log(`tutorial art: ${Object.keys(pictures).length} pictures in ${OUT}`);
} finally {
  await browser.close();
}
