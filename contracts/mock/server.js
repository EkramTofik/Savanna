// Contract C6: GET /v1/<path>  ->  contracts/fixtures/v1/<path>.json
import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("contracts/fixtures");
const app = express();
app.use(cors());
app.get("/v1/*", (req, res) => {
  const file = path.resolve(root, "." + req.path + ".json");
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
    return res.status(404).type("application/problem+json").json({ title: "Not found", status: 404 });
  }
  res.json(JSON.parse(fs.readFileSync(file, "utf8")));
});
const port = process.env.MOCK_PORT || 4010;
app.listen(port, () => console.log(`Mock API on http://localhost:${port}`));
