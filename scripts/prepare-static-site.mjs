import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.join(root, "dist", "site");
const markerName = ".enkopa-static-site-build";
const marker = path.join(root, "dist", markerName);
const apiBaseInput = process.env.SAVANNA_API_BASE;
const publicKey = process.env.SAVANNA_PUBLIC_KEY;

if (!apiBaseInput || !publicKey) {
  throw new Error(
    "Set SAVANNA_API_BASE to the deployed HTTPS API origin and SAVANNA_PUBLIC_KEY to its publishable partner key before building the static site.",
  );
}

const apiBase = new URL(apiBaseInput);
if (
  apiBase.protocol !== "https:" ||
  apiBase.pathname !== "/" ||
  apiBase.search ||
  apiBase.hash ||
  apiBase.username ||
  apiBase.password
) {
  throw new Error("SAVANNA_API_BASE must be an HTTPS origin with no path, query, or credentials.");
}
if (publicKey.length < 8 || publicKey === "pk_dev_local") {
  throw new Error("SAVANNA_PUBLIC_KEY must be the configured publishable key, not pk_dev_local.");
}

function copy(source, destination) {
  const from = path.join(root, source);
  const to = path.join(site, destination);
  if (!fs.existsSync(from)) throw new Error(`Required deployment file is missing: ${source}`);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

// Keep this bundle limited to the hosted course demo and the files it needs.
if (fs.existsSync(site)) {
  const oldMarker = path.join(site, markerName);
  const ownsSite = [marker, oldMarker].some(
    (file) => fs.existsSync(file) && fs.readFileSync(file, "utf8") === "enkopa-pitch-static-site\n",
  );
  if (!ownsSite) {
    throw new Error(`Refusing to replace existing output without this script's marker: ${path.relative(root, site)}`);
  }
  fs.rmSync(site, { recursive: true, force: true });
}
fs.mkdirSync(site, { recursive: true });
fs.mkdirSync(path.dirname(marker), { recursive: true });
fs.writeFileSync(marker, "enkopa-pitch-static-site\n");
copy("savanna/assets", "savanna/assets");
const bundleAssetsFile = path.join(root, "savanna", "module", "savanna-access.v1.assets.json");
if (!fs.existsSync(bundleAssetsFile)) {
  throw new Error("Player bundle asset manifest is missing; run the component build first.");
}
const bundleAssets = JSON.parse(fs.readFileSync(bundleAssetsFile, "utf8"));
if (bundleAssets.entry !== "savanna-access.v1.js" || !Array.isArray(bundleAssets.files)) {
  throw new Error("Player bundle asset manifest is invalid.");
}
for (const file of bundleAssets.files) {
  if (typeof file !== "string" || path.isAbsolute(file) || file.split(/[\\/]/).includes("..")) {
    throw new Error(`Unsafe player bundle asset path: ${String(file)}`);
  }
  copy(path.join("savanna", "module", file), path.join("savanna", "module", file));
}
copy("demo/savanna-patch.css", "demo/savanna-patch.css");
copy("demo/savanna-patch.js", "demo/savanna-patch.js");
copy("media-sw.js", "media-sw.js");

const coursePath = "savanna/pages/concept-with-navigation.html";
const sourcePage = fs.readFileSync(path.join(root, coursePath), "utf8");
// The course page is also served by the same-origin Render deployment, where
// api="/" and pk_demo_public are intentional. The separate static-site build
// must rewrite either supported local/demo configuration to the real API origin
// and publishable key supplied by the deployment environment.
const apiAttributes = [...sourcePage.matchAll(/(?:^|\\s)api="([^"]*)"/g)].map((match) => match[1]);
const keyAttributes = [...sourcePage.matchAll(/(?:^|\\s)api-key="([^"]*)"/g)].map((match) => match[1]);
const supportedApiValues = new Set(["http://localhost:4010", "/"]);
const supportedKeyValues = new Set(["pk_dev_local", "pk_demo_public"]);
const faviconCount = sourcePage.split('href="/favicon_alx.ico"').length - 1;
const touchIconCount = sourcePage.split('href="/apple-touch-icon_alx.png"').length - 1;
if (
  apiAttributes.length !== 2 ||
  keyAttributes.length !== 2 ||
  apiAttributes.some((value) => !supportedApiValues.has(value)) ||
  keyAttributes.some((value) => !supportedKeyValues.has(value)) ||
  faviconCount !== 1 ||
  touchIconCount !== 1
) {
  throw new Error(
    `Unexpected deploy-sensitive attributes in ${coursePath}: API attributes=${apiAttributes.length}, API keys=${keyAttributes.length}, favicon=${faviconCount}, touch icon=${touchIconCount}. Review the page before publishing.`,
  );
}

const pageWithoutLegacyIcons = sourcePage
  .replace(/(^|\\s)api="(?:http:\\/\\/localhost:4010|\\/)"/g, (_, prefix) => `${prefix}api="${apiBase.origin}"`)
  .replace(/(^|\\s)api-key="(?:pk_dev_local|pk_demo_public)"/g, (_, prefix) => `${prefix}api-key="${publicKey}"`)
  .replace(/^[ \t]*<link rel="icon" type="image\/x-icon" href="\/favicon_alx\.ico" \/>\r?\n/gm, "")
  .replace(/^[ \t]*<link rel="apple-touch-icon" href="\/apple-touch-icon_alx\.png" \/>\r?\n/gm, "");
if (pageWithoutLegacyIcons.toLowerCase().split("</head>").length !== 2) {
  throw new Error(`Expected one closing </head> element in ${coursePath}.`);
}
const favicon = '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22/%3E">';
const publishedPage = pageWithoutLegacyIcons.replace(/<\/head>/i, `  ${favicon}\n</head>`);
const pageOutput = path.join(site, coursePath);
fs.mkdirSync(path.dirname(pageOutput), { recursive: true });
fs.writeFileSync(pageOutput, publishedPage);

// Publish only media referenced by the L-102/L-103 lesson records. The standalone
// AD fixtures and the sign-window placeholder are deliberately excluded.
const mediaUrls = new Set();
for (const id of ["L-102", "L-103"]) {
  const lessonFile = path.join(root, "contracts", "fixtures", "v1", "lessons", `${id}.json`);
  const lesson = JSON.parse(fs.readFileSync(lessonFile, "utf8"));
  for (const url of [lesson.media?.video, lesson.media?.audio, ...lesson.captions.map((item) => item.url)]) {
    if (typeof url !== "string" || !url.startsWith("/media/")) {
      throw new Error(`${id} contains a missing or non-local lesson asset URL: ${String(url)}`);
    }
    const name = url.slice("/media/".length);
    if (!name || name.includes("/") || name.includes("\\") || name === "." || name === "..") {
      throw new Error(`${id} contains an unsupported media path: ${url}`);
    }
    mediaUrls.add(name);
  }
}

for (const name of mediaUrls) copy(path.join("contracts/fixtures/media", name), path.join("media", name));

fs.writeFileSync(
  path.join(site, "index.html"),
  `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Enkopa lesson demonstration</title>\n${favicon}\n</head>\n<body>\n<main>\n<h1>Enkopa lesson demonstration</h1>\n<p>This hosted package opens the existing Savanna course page.</p>\n<p><a href="/savanna/pages/concept-with-navigation.html">Open the lesson demonstration</a></p>\n</main>\n</body>\n</html>\n`,
);

console.log(`Prepared ${path.relative(root, site)} with the Savanna course page and ${mediaUrls.size} lesson media files.`);
