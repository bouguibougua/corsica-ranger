/**
 * Regenerate the web assets without changing the supplied image originals.
 * Run on macOS with `npm run assets`. sips is required for HEIC sources.
 * macOS's HEIC decoder needs access to its media services; a restricted
 * execution sandbox can silently produce black images. This script rejects
 * such conversions. Already generated WebP files need no macOS dependency.
 * Optional `--fetch` downloads missing official villa images/logo/fonts.
 */
import sharp from "sharp";
import {
  mkdir,
  mkdtemp,
  writeFile,
  readFile,
  access,
  rm,
} from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";
import * as sources from "./photo-sources.mjs";
const {
  photoSources,
  officialVillaBase,
  fontSources,
  photoAliases = {},
} = sources;

const exec = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const out = join(root, "public/assets");
const photosDir = join(out, "photos");
const scratch = await mkdtemp(join(tmpdir(), "corsica-assets-"));
const onlyArgument = process.argv.find((argument) =>
  argument.startsWith("--only="),
);
const only = onlyArgument
  ? new Set(onlyArgument.slice(7).split(",").filter(Boolean))
  : null;
const exists = async (file) =>
  access(file).then(
    () => true,
    () => false,
  );
await mkdir(photosDir, { recursive: true });
await mkdir(join(out, "fonts"), { recursive: true });

async function downloadMissing(url, file) {
  if (await exists(file)) return;
  await mkdir(join(file, ".."), { recursive: true });
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Download failed: ${response.status} ${url}`);
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
}

if (process.argv.includes("--fetch")) {
  await downloadMissing(
    "https://corsicaranger.com/templates/corsica/images/logo-2021.jpg",
    join(out, "logo-original.jpg"),
  );
  for (const [name, url] of fontSources)
    await downloadMissing(url, join(out, "fonts", name));
  for (const entry of photoSources.filter((entry) =>
    entry.file.startsWith("villas-officielles/"),
  )) {
    const villa = entry.category;
    await downloadMissing(
      `${officialVillaBase}/villa-${villa}/${basename(entry.file)}`,
      join(root, "image", entry.file),
    );
  }
}

// Faithful crop of the white head and original Corsica Ranger lettering.
// The JPEG's blue background is removed using its existing white matte.
async function prepareLogo() {
  const original = join(out, "logo-original.jpg");
  if (!(await exists(original)))
    throw new Error("Missing official logo. Run with --fetch first.");
  const { data, info } = await sharp(original)
    .extract({ left: 145, top: 0, width: 410, height: 68 })
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let p = 0; p < info.width * info.height; p++) {
    // Original blue matte red component is about 111, white foreground 255.
    let alpha = Math.max(0, Math.min(1, (data[p * info.channels] - 112) / 143));
    if (alpha < 0.065) alpha = 0;
    rgba[p * 4] = rgba[p * 4 + 1] = rgba[p * 4 + 2] = 255;
    rgba[p * 4 + 3] = Math.round(alpha * 255);
  }
  await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(join(out, "logo.png"));
}

async function preparePhoto(entry) {
  let input = join(root, "image", entry.file);
  if (!(await exists(input)))
    throw new Error(`Missing original: ${entry.file}`);
  if (/\.heic$/i.test(entry.file)) {
    if (process.platform !== "darwin")
      throw new Error(
        "HEIC regeneration requires macOS and sips. Use the committed WebP assets on other platforms.",
      );
    const decoded = join(scratch, `${entry.id}.jpg`);
    await exec("sips", ["-s", "format", "jpeg", input, "--out", decoded]);
    const stats = await sharp(decoded).stats();
    if (stats.channels.every((channel) => channel.max < 5)) {
      throw new Error(
        `HEIC decoder returned a black image for ${entry.file}. Run asset preparation outside the restricted sandbox on macOS.`,
      );
    }
    input = decoded;
  }
  const original = await sharp(input).metadata();
  const rotates = original.orientation && original.orientation >= 5;
  const originalWidth = rotates ? original.height : original.width;
  const widths = [640, 1000, 1600, 2000].filter(
    (width) => width <= originalWidth,
  );
  // Small official villa images retain their exact native maximum resolution.
  if (originalWidth < 2000 && !widths.includes(originalWidth))
    widths.push(originalWidth);
  widths.sort((a, b) => a - b);
  const generated = [];
  for (const width of widths) {
    const filename = `${entry.id}-${width}.webp`;
    const result = await sharp(input)
      .rotate()
      .toColourspace("srgb")
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(join(photosDir, filename));
    generated.push({
      src: `/assets/photos/${filename}`,
      width: result.width,
      height: result.height,
    });
  }
  const defaultImage =
    generated.find((image) => image.width === 1600) || generated.at(-1);
  return {
    id: entry.id,
    src: defaultImage.src,
    srcset: generated.map((image) => `${image.src} ${image.width}w`).join(", "),
    width: defaultImage.width,
    height: defaultImage.height,
    category:
      {
        sunset: "corse",
        landscape: "corse",
        bergerie: "corse",
        story: "buggy",
        lavezzi: "maisons",
        cavallo: "maisons",
      }[entry.category] || entry.category,
    alt: entry.alt,
  };
}

try {
  if (!only) await prepareLogo();
  const previous = only
    ? JSON.parse(await readFile(join(photosDir, "manifest.json"), "utf8"))
        .gallery
    : [];
  const previousById = new Map(previous.map((entry) => [entry.id, entry]));
  if (only)
    for (const id of only) {
      if (!photoSources.some((entry) => entry.id === id))
        throw new Error(`Unknown selected photo: ${id}`);
    }
  const entries = [];
  for (const source of photoSources) {
    if (!only || only.has(source.id) || !previousById.has(source.id)) {
      entries.push(await preparePhoto(source));
      console.log(`Prepared ${source.id}`);
    } else entries.push({ ...previousById.get(source.id), alt: source.alt });
  }
  const byId = Object.fromEntries(entries.map((entry) => [entry.id, entry]));
  const photos = Object.fromEntries(
    ["hero", "buggy", "quad", "sunset", "landscape", "story", "bergerie"].map(
      (id) => [id, byId[id]],
    ),
  );
  photos.lavezzi = byId["lavezzi-1"];
  photos.cavallo = byId["cavallo-1"];
  photos.raids = byId.raids;
  for (const [name, id] of Object.entries(photoAliases)) {
    if (!byId[id]) throw new Error(`Unknown photo alias: ${name} → ${id}`);
    photos[name] = byId[id];
  }
  const villaPhotos = {
    lavezzi: entries.filter((entry) => entry.id.startsWith("lavezzi-")),
    cavallo: entries.filter((entry) => entry.id.startsWith("cavallo-")),
  };
  await mkdir(join(root, "src"), { recursive: true });
  const code = `// Generated by scripts/prepare-assets.mjs. Originals remain in image/.\nexport const photos = ${JSON.stringify(photos, null, 2)};\n\nexport const gallery = ${JSON.stringify(entries, null, 2)};\n\nexport const villaPhotos = ${JSON.stringify(villaPhotos, null, 2)};\n`;
  await writeFile(join(root, "src/assets.mjs"), code);
  await writeFile(
    join(out, "photos/manifest.json"),
    JSON.stringify({ photos, gallery: entries, villaPhotos }, null, 2) + "\n",
  );
  console.log(
    `Generated ${entries.length} photographs, responsive WebP variants and faithful official logo.`,
  );
} finally {
  await rm(scratch, { recursive: true, force: true });
}
