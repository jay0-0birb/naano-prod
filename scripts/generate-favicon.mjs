/**
 * Generates public/favicon.ico from public/logo.svg so the naano logo
 * is used as the browser tab icon (fixes Safari/Vercel default triangle).
 * Run: node scripts/generate-favicon.mjs
 */

import sharp from "sharp";
import toIco from "to-ico";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "logo.svg");
// Next.js App Router: app/favicon.ico + app/apple-icon.png (Safari uses apple-icon)
const appFavicon = join(root, "app", "favicon.ico");
const publicFavicon = join(root, "public", "favicon.ico");
const appAppleIcon = join(root, "app", "apple-icon.png");
const publicAppleIcon = join(root, "public", "apple-icon.png");

const icoSizes = [16, 32, 48];
const APPLE_ICON_SIZE = 180;

async function main() {
  const svg = readFileSync(svgPath);

  // Favicon.ico for Chrome, etc.
  const pngs = await Promise.all(
    icoSizes.map((size) => sharp(svg).resize(size, size).png().toBuffer())
  );
  const ico = await toIco(pngs);
  writeFileSync(appFavicon, ico);
  writeFileSync(publicFavicon, ico);

  // Apple touch icon (PNG) – Safari uses this for the tab icon
  const applePng = await sharp(svg).resize(APPLE_ICON_SIZE, APPLE_ICON_SIZE).png().toBuffer();
  writeFileSync(appAppleIcon, applePng);
  writeFileSync(publicAppleIcon, applePng);

  console.log("Wrote app/favicon.ico, public/favicon.ico, app/apple-icon.png, public/apple-icon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
