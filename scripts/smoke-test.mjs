import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const requireFromApi = createRequire(fileURLToPath(new URL("../api/package.json", import.meta.url)));
const { Validator } = requireFromApi("@seriousme/openapi-schema-validator");

function optionsFromArgs(argv) {
  const values = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument: ${arg}`);
    const name = arg.slice(2);
    if (name === "help") return { help: true };
    const value = argv[++i];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${name}`);
    values[name] = value;
  }
  return values;
}

const args = optionsFromArgs(process.argv.slice(2));
if (args.help) {
  console.log("Usage: pnpm smoke --base <API-origin> [--media-base <lesson-page-origin>] [--origin <Savanna-page-origin>]");
  console.log("Set SAVANNA_SMOKE_API_KEY and SAVANNA_SMOKE_CREDENTIAL_ID in the environment.");
  process.exit(0);
}

const baseInput = args.base ?? process.env.SAVANNA_SMOKE_BASE;
if (!baseInput) throw new Error("Provide --base or SAVANNA_SMOKE_BASE.");
const apiBase = new URL(baseInput);
const isLoopback = ["localhost", "127.0.0.1", "[::1]"].includes(apiBase.hostname);
if (apiBase.protocol !== "https:" && !(apiBase.protocol === "http:" && isLoopback)) {
  throw new Error("The API base must use HTTPS, except for localhost development.");
}
if (apiBase.pathname !== "/" || apiBase.search || apiBase.hash || apiBase.username || apiBase.password) {
  throw new Error("The API base must be an origin without a path, query, or credentials.");
}

const mediaBase = new URL(args["media-base"] ?? process.env.SAVANNA_SMOKE_MEDIA_BASE ?? apiBase.origin);
const origin = args.origin ?? process.env.SAVANNA_SMOKE_ORIGIN ?? (isLoopback ? "http://localhost:5174" : "");
if (!origin) throw new Error("Set --origin or SAVANNA_SMOKE_ORIGIN to the exact Savanna page origin.");
const apiKey = args["api-key"] ?? process.env.SAVANNA_SMOKE_API_KEY ?? (isLoopback ? "pk_dev_local" : "");
if (!apiKey) throw new Error("Set SAVANNA_SMOKE_API_KEY for the target API.");
const credentialId = args["credential-id"] ?? process.env.SAVANNA_SMOKE_CREDENTIAL_ID ?? "C-7";

function apiUrl(path) {
  return new URL(path, apiBase);
}

function assetUrl(path) {
  if (/^https?:\/\//i.test(path)) return new URL(path);
  return new URL(path, path.startsWith("/v1/") ? apiBase : mediaBase);
}

async function request(url, { key = false, accept, headers = {} } = {}) {
  const requestHeaders = { ...headers, Origin: origin };
  if (key) requestHeaders["X-Savanna-Key"] = apiKey;
  if (accept) requestHeaders.Accept = accept;
  return fetch(url, { headers: requestHeaders, signal: AbortSignal.timeout(15_000) });
}

function contentType(response) {
  return response.headers.get("content-type")?.toLowerCase() ?? "";
}

function assertType(response, expected, label) {
  assert.match(contentType(response), expected, `${label}: unexpected content type ${contentType(response)}`);
}

function parseVtt(text, durationSec, label) {
  assert.match(text, /^WEBVTT(?:\s|$)/, `${label}: missing WEBVTT header`);
  const timestamp = /^(?:(\d{2,}):)?(\d{2}):(\d{2}\.\d{3})$/;
  const seconds = (value) => {
    const match = value.match(timestamp);
    assert.ok(match, `${label}: invalid timestamp ${value}`);
    return Number(match[1] ?? 0) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  };
  const cues = [...text.matchAll(/^(\S+)\s+-->\s+(\S+)\s*$/gm)];
  assert.ok(cues.length > 0, `${label}: no cues found`);
  let lastEnd = 0;
  for (const cue of cues) {
    const start = seconds(cue[1]);
    const end = seconds(cue[2]);
    assert.ok(end > start, `${label}: cue end must follow cue start`);
    lastEnd = Math.max(lastEnd, end);
  }
  assert.ok(lastEnd >= durationSec * 0.9, `${label}: last cue ends at ${lastEnd}s, before 90% of ${durationSec}s`);
  return { count: cues.length, lastEnd };
}

const passed = [];
function pass(message) {
  passed.push(message);
  console.log(`PASS ${message}`);
}

const healthResponse = await request(apiUrl("/v1/health"));
assert.equal(healthResponse.status, 200, "health endpoint should return 200");
assert.equal((await healthResponse.json()).status, "ok", "health status should be ok");
pass("health endpoint responds");

const openApiResponse = await request(apiUrl("/v1/openapi.json"));
assert.equal(openApiResponse.status, 200, "OpenAPI endpoint should return 200");
assert.match(contentType(openApiResponse), /application\/json/, "OpenAPI response should be JSON");
const spec = await openApiResponse.json();
assert.equal(spec.openapi, "3.1.0", "OpenAPI version should be 3.1.0");
const validation = await new Validator().validate(spec);
assert.equal(validation.valid, true, `OpenAPI validation failed: ${JSON.stringify(validation.errors)}`);
pass("OpenAPI 3.1 validates at the stable API endpoint");

const lessonResponse = await request(apiUrl("/v1/lessons/L-102"), { key: true });
assert.equal(lessonResponse.status, 200, "lesson manifest should return 200");
assert.match(contentType(lessonResponse), /application\/json/, "lesson manifest should be JSON");
assert.equal(lessonResponse.headers.get("access-control-allow-origin"), origin, "API CORS should allow the configured Savanna origin");
const lesson = await lessonResponse.json();
assert.equal(lesson.id, "L-102");
assert.ok(Number.isFinite(lesson.durationSec) && lesson.durationSec > 0, "lesson duration should be positive");
assert.ok(lesson.media?.video && lesson.media?.audio, "lesson video and audio URLs should exist");
assert.ok(Array.isArray(lesson.captions), "lesson captions should be an array");
assert.ok(lesson.transcript?.url, "lesson transcript URL should exist");
pass(`L-102 manifest and CORS respond (${lesson.durationSec}s)`);

const assets = [
  { name: "video", path: lesson.media.video, type: /video\/mp4/ },
  { name: "audio", path: lesson.media.audio, type: /audio\/(?:ogg|opus)|application\/ogg/ },
  ...lesson.captions.map((caption) => ({ name: `captions-${caption.lang}`, path: caption.url, type: /text\/vtt/ })),
  { name: "transcript", path: lesson.transcript.url, type: /application\/json/ },
];
if (lesson.sign) {
  assets.push({ name: "sign", path: lesson.sign.url, type: /video\/mp4/ });
}
if (lesson.audioDescription) {
  assets.push({ name: "audio-description", path: lesson.audioDescription.audioUrl, type: /audio\/(?:ogg|opus)|application\/ogg/ });
  assets.push({ name: "audio-description-cues", path: lesson.audioDescription.vttUrl, type: /text\/vtt/ });
}

let englishTranscript;
for (const asset of assets) {
  const response = await request(assetUrl(asset.path), { key: asset.path.startsWith("/v1/") });
  assert.equal(response.status, 200, `${asset.name} should return 200`);
  assertType(response, asset.type, asset.name);
  if (asset.name === "captions-en" || asset.name === "captions-am") {
    const check = parseVtt(await response.text(), lesson.durationSec, asset.name);
    pass(`${asset.name} parses (${check.count} cues through ${check.lastEnd}s)`);
  } else if (asset.name === "transcript") {
    englishTranscript = await response.json();
    assert.ok(Array.isArray(englishTranscript.lines) && englishTranscript.lines.length > 0, "transcript should have timed lines");
  } else {
    await response.arrayBuffer();
    pass(`${asset.name} returns 200 with expected content type`);
  }
}

const mediaRange = await request(assetUrl(lesson.media.video), { headers: { Range: "bytes=0-1023" } });
assert.equal(mediaRange.status, 206, "video should support byte-range requests");
assert.match(mediaRange.headers.get("content-range") ?? "", /^bytes 0-1023\/\d+$/, "video should return a valid Content-Range");
await mediaRange.arrayBuffer();
pass("video supports byte ranges");

if (lesson.pack?.manifestUrl) {
  const packResponse = await request(apiUrl(lesson.pack.manifestUrl), { key: true });
  assert.equal(packResponse.status, 200, "offline pack manifest should return 200");
  assert.match(contentType(packResponse), /application\/json/, "offline pack manifest should be JSON");
  const pack = await packResponse.json();
  assert.ok(Array.isArray(pack.files) && pack.files.length > 0, "offline pack should list files");
  pass(`offline pack manifest lists ${pack.files.length} files`);
}

const credentialResponse = await request(apiUrl(`/verify/${encodeURIComponent(credentialId)}`), { accept: "application/ld+json" });
assert.equal(credentialResponse.status, 200, `credential ${credentialId} should be available at /verify`);
assert.match(contentType(credentialResponse), /application\/ld\+json/, "credential verification endpoint should return JSON-LD");
const credential = await credentialResponse.json();
assert.ok(credential.id && credential.issuer && credential.proof, "credential should include issuer and proof fields");
pass(`credential ${credentialId} is served by the verification endpoint (JSON-LD and proof fields present)`);

console.log(`Smoke test passed: ${passed.length} checks. Health is process-level only; this does not prove database readiness or cryptographic VC conformance.`);
