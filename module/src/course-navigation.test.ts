import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const file = (relativePath: string) => new URL(`../../${relativePath}`, import.meta.url);

test("Savanna course navigation links only to published lesson fixtures", async () => {
  const page = await readFile(file("savanna/pages/concept-with-navigation.html"), "utf8");
  const menuStart = page.indexOf('id="curriculum_navigation_menu"');
  const menuEnd = page.indexOf('id="curriculum_navigation_content"', menuStart);
  assert.ok(menuStart >= 0 && menuEnd > menuStart, "lesson navigation menu should exist");
  const menu = page.slice(menuStart, menuEnd);

  assert.doesNotMatch(menu, /href\s*=\s*["']#["']/i);
  assert.match(menu, /VA course activity routes are not included in this local export/);

  for (const id of ["L-102", "L-103"]) {
    const fixture = JSON.parse(await readFile(file(`contracts/fixtures/v1/lessons/${id}.json`), "utf8"));
    assert.match(menu, new RegExp(`data-lesson-id="${id}"`));
    assert.match(menu, new RegExp(`href="\\?lesson=${id}#lesson-player"`));
    assert.match(page, new RegExp(`"${id}"`));
    assert.equal(fixture.id, id);
  }

  const l102 = JSON.parse(await readFile(file("contracts/fixtures/v1/lessons/L-102.json"), "utf8"));
  const l103 = JSON.parse(await readFile(file("contracts/fixtures/v1/lessons/L-103.json"), "utf8"));
  assert.equal(l102.media.video, l103.media.video, "duplicate source media should be disclosed in the menu");
});

test("course lesson routes update the player and selected state while preserving native links", async () => {
  const page = await readFile(file("savanna/pages/concept-with-navigation.html"), "utf8");
  
  // Check that inline script has been replaced with external script (CSP compliance)
  assert.match(page, /<script\s+src="\.\.\/assets\/js\/lesson-routing\.js"\s+defer><\/script>/);
  assert.doesNotMatch(page, /\(\(\) => \{[\s\S]*availableLessons/);  // No inline script
  
  // Check that the external script file exists and contains the expected logic
  const script = await readFile(file("savanna/assets/js/lesson-routing.js"), "utf8");
  assert.match(script, /player\.setAttribute\("lesson", lessonId\)/);
  assert.match(script, /offline\.setAttribute\("lesson-id", lessonId\)/);
  assert.match(script, /link\.setAttribute\("aria-current", "page"\)/);
  assert.match(script, /link\.classList\.toggle\("active", selected\)/);
  assert.match(script, /addEventListener\("popstate", applyLessonRoute\)/);
  assert.match(script, /is not available in this local export\. Showing L-102\./);
  assert.doesNotMatch(script, /preventDefault\(\)/, "lesson anchors retain browser navigation behavior");
});
