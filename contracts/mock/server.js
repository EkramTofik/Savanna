// Contract C6: GET /v1/<path>  ->  contracts/fixtures/v1/<path>.json
// Static media: GET /media/<file>  ->  contracts/fixtures/media/<file>
// Pack ZIP:     GET /v1/lessons/:id/pack.zip  ->  dynamic zip of fixture files
import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import archiver from "archiver";

const root = path.resolve("contracts/fixtures");
const app = express();
app.use(cors({ exposedHeaders: ["Accept-Ranges", "Content-Range", "Content-Length", "Content-Disposition", "ETag"] }));
app.use("/media", express.static(path.join(root, "media")));

// Serve pack.zip dynamically for any lesson that has a pack.json fixture
app.get("/v1/lessons/:id/pack.zip", (req, res) => {
  const id = req.params.id;
  // Validate id to prevent path traversal
  if (!/^[\w-]{1,80}$/.test(id)) {
    return res.status(400).type("application/problem+json").json({ title: "Bad request", status: 400 });
  }
  const packJson = path.resolve(root, "v1/lessons", id, "pack.json");
  if (!packJson.startsWith(root) || !fs.existsSync(packJson)) {
    return res.status(404).type("application/problem+json").json({ title: "Not found", status: 404 });
  }
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${id}-pack.zip"`);
  res.setHeader("Accept-Ranges", "bytes");
  const archive = archiver("zip", { zlib: { level: 1 } });
  const chunks = [];
  archive.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  archive.on("error", (err) => { if (!res.headersSent) res.status(500).end(); console.error(err); });
  archive.on("end", () => {
    const zip = Buffer.concat(chunks);
    res.setHeader("Content-Length", String(zip.length));
    const rangeHeader = req.headers.range;
    if (!rangeHeader) return res.end(zip);

    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    if (!match || (!match[1] && !match[2])) {
      res.setHeader("Content-Range", `bytes */${zip.length}`);
      return res.status(416).type("application/problem+json").json({ title: "Invalid range", status: 416 });
    }
    const suffixLength = match[1] ? 0 : Number(match[2]);
    const start = match[1] ? Number(match[1]) : Math.max(0, zip.length - suffixLength);
    const requestedEnd = match[1] && match[2] ? Number(match[2]) : zip.length - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(requestedEnd) || !Number.isSafeInteger(suffixLength) || start >= zip.length || requestedEnd < start) {
      res.setHeader("Content-Range", `bytes */${zip.length}`);
      return res.status(416).type("application/problem+json").json({ title: "Range not satisfiable", status: 416 });
    }
    const end = Math.min(requestedEnd, zip.length - 1);
    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${zip.length}`);
    res.setHeader("Content-Length", String(end - start + 1));
    return res.end(zip.subarray(start, end + 1));
  });
  // Bundle exactly the media files declared by the lesson pack manifest.
  const mediaDir = path.join(root, "media");
  const pack = JSON.parse(fs.readFileSync(packJson, "utf8"));
  if (!Array.isArray(pack.files) || pack.files.some((file) => typeof file.path !== "string")) {
    return res.status(500).type("application/problem+json").json({ title: "Invalid pack manifest", status: 500 });
  }
  for (const file of pack.files) {
    const resolvedMediaDir = path.resolve(mediaDir);
    const resolvedFile = path.resolve(resolvedMediaDir, file.path);
    if (!resolvedFile.startsWith(resolvedMediaDir + path.sep) || !fs.existsSync(resolvedFile)) {
      return res.status(500).type("application/problem+json").json({ title: "Invalid pack asset", status: 500 });
    }
    archive.file(resolvedFile, { name: file.path });
  }
  // Include manifest
  archive.file(packJson, { name: "manifest.json" });
  archive.finalize();
});

app.get("/v1/*", (req, res) => {
  const file = path.resolve(root, "." + req.path + ".json");
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
    return res
      .status(404)
      .type("application/problem+json")
      .json({ title: "Not found", status: 404 });
  }
  res.json(JSON.parse(fs.readFileSync(file, "utf8")));
});
const port = process.env.MOCK_PORT || 4010;
app.listen(port, () => console.log(`Mock API on http://localhost:${port}`));
