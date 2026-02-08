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
const outPath = join(root, "public", "favicon.ico");

const sizes = [16, 32, 48];

async function main() {
  const svg = readFileSync(svgPath);
  const pngs = await Promise.all(
    sizes.map((size) =>
      sharp(svg).resize(size, size).png().toBuffer()
    )
  );
  const ico = await toIco(pngs);
  writeFileSync(outPath, ico);
  console.log("Wrote public/favicon.ico");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
