import test from "node:test";
import assert from "node:assert/strict";
import { answerLessonQuestion } from "./lesson-qa.ts";

test("answers the main-idea question in English from the lesson", () => {
  const result = answerLessonQuestion("What is the main idea of this lesson?", "L-102");
  assert.equal(result.language, "en");
  assert.equal(result.supported, true);
  assert.match(result.answer, /short online videos/i);
});

test("answers the matching Amharic question in Ethiopic script", () => {
  const result = answerLessonQuestion("የዚህ ትምህርት ዋና ሐሳብ ምንድነው?", "L-102");
  assert.equal(result.language, "am");
  assert.equal(result.supported, true);
  assert.match(result.answer, /ተናጋሪው/u);
});

test("answers a natural Amharic question about what the lesson is about", () => {
  const result = answerLessonQuestion("ትምህርቱ ስለ ምን ነው?", "L-102");
  assert.equal(result.language, "am");
  assert.equal(result.supported, true);
  assert.match(result.answer, /ተናጋሪው/u);
});

test("describes 4:12 as the speaker’s claim rather than a current fact", () => {
  const en = answerLessonQuestion("What does 4 minutes and 12 seconds mean?", "L-103");
  const am = answerLessonQuestion("4 ደቂቃ ከ12 ሰከንድ ምን ማለት ነው?", "L-103");
  assert.match(en.answer, /not as a verified current statistic/i);
  assert.match(am.answer, /የተረጋገጠ/u);
});

test("does not invent answers for unsupported questions or lessons", () => {
  assert.equal(answerLessonQuestion("What is the capital?", "L-102").supported, false);
  assert.equal(answerLessonQuestion("የዚህ ትምህርት ሐሳብ ምንድነው?", "L-999").supported, false);
});
