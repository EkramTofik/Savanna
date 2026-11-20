import test from "node:test";
import assert from "node:assert/strict";
import { createLightLessonHtml } from "./light-page.mjs";

test("standalone light page is small, works with sibling media, and has no JS bundle", () => {
  const page = createLightLessonHtml({
    title: "A lesson",
    cuesEn: [{ start: 0, end: 3, text: "Check the course address." }],
    cuesAm: [{ start: 0, end: 3, text: "የኮርሱን አድራሻ ያረጋግጡ።" }],
  });
  assert.ok(Buffer.byteLength(page) <= 50 * 1024);
  assert.match(page, /src="lesson-audio\.opus"/);
  assert.match(page, /audio\.addEventListener\('timeupdate',sync\)/);
  assert.match(page, /list\.lang=lang/);
  assert.doesNotMatch(page, /<script\s+src=/i);
  assert.doesNotMatch(page, /<link[^>]+stylesheet/i);
});
