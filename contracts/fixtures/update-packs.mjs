import archiver from 'archiver';
import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturesRoot = path.dirname(fileURLToPath(import.meta.url));
const mediaRoot = path.join(fixturesRoot, 'media');

for (const lessonId of ['L-102', 'L-103']) {
  const lessonPath = path.join(fixturesRoot, 'v1', 'lessons', `${lessonId}.json`);
  const lessonDirectory = path.join(fixturesRoot, 'v1', 'lessons', lessonId);
  const packPath = path.join(lessonDirectory, 'pack.json');
  const lesson = JSON.parse(readFileSync(lessonPath, 'utf8'));
  const pack = JSON.parse(readFileSync(packPath, 'utf8'));

  for (const file of pack.files) {
    if (!file.path || path.basename(file.path) !== file.path) throw new Error(`Unsafe path in ${lessonId} pack: ${file.path}`);
    const assetPath = path.join(mediaRoot, file.path);
    if (!existsSync(assetPath)) throw new Error(`Missing ${lessonId} pack asset: ${assetPath}`);
    const bytes = readFileSync(assetPath);
    file.sizeBytes = bytes.byteLength;
    file.sha256 = createHash('sha256').update(bytes).digest('hex');
  }

  pack.sizeBytes = pack.files.reduce((sum, file) => sum + file.sizeBytes, 0);
  writeFileSync(packPath, `${JSON.stringify(pack, null, 2)}\n`);
  lesson.pack.sizeBytes = pack.sizeBytes;
  writeFileSync(lessonPath, `${JSON.stringify(lesson, null, 2)}\n`);

  const zipPath = path.join(lessonDirectory, 'pack.zip');
  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.once('close', resolve);
    output.once('error', reject);
    archive.once('error', reject);
    archive.pipe(output);
    for (const file of pack.files) archive.file(path.join(mediaRoot, file.path), { name: file.path });
    archive.file(packPath, { name: 'manifest.json' });
    void archive.finalize();
  });
  console.log(`${lessonId}: ${pack.files.length} assets, ${pack.sizeBytes} payload bytes, ${path.basename(zipPath)} refreshed`);
}
