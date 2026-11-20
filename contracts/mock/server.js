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
app.use(cors());
app.use("/media", express.static(path.join(root, "media")));

// Serve pack.zip dynamically for any lesson that has a pack.json fixture
app.get("/v1/lessons/:id/pack.zip", (req, res) => {
  const id = req.params.id;
  // Validate id to prevent path traversal
  if (!/^[\w-]{1,80}$/.test(id)) {
    return res
      .status(400)
      .type("application/problem+json")
      .json({ title: "Bad request", status: 400 });
  }
  const packJson = path.resolve(root, "v1/lessons", id, "pack.json");
  if (!packJson.startsWith(root) || !fs.existsSync(packJson)) {
    return res
      .status(404)
      .type("application/problem+json")
      .json({ title: "Not found", status: 404 });
  }
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${id}-pack.zip"`);
  res.setHeader("Accept-Ranges", "bytes");
  const archive = archiver("zip", { zlib: { level: 1 } });
  archive.on("error", (err) => {
    if (!res.headersSent) res.status(500).end();
    console.error(err);
  });
  archive.pipe(res);
  // Bundle only files declared by this pack; placeholder description/sign assets are excluded.
  const mediaDir = path.join(root, "media");
  const pack = JSON.parse(fs.readFileSync(packJson, "utf8"));
  for (const entry of pack.files || []) {
    if (
      typeof entry.path !== "string" ||
      path.isAbsolute(entry.path) ||
      entry.path.split(/[\\/]/).includes("..")
    )
      continue;
    const base = entry.path === "transcript.json" ? path.join(root, "v1", "lessons", id) : mediaDir;
    const f = path.resolve(base, entry.path);
    if (f.startsWith(base + path.sep) && fs.existsSync(f) && fs.statSync(f).isFile()) {
      archive.file(f, { name: entry.path.replaceAll("\\", "/") });
    }
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
