import test from "node:test";
import assert from "node:assert/strict";
import { parseTimestamp, parseWebVtt } from "./vtt-parser.ts";

test("WebVTT parser accepts valid timestamps and rejects malformed time fields", () => {
  assert.equal(parseTimestamp("00:04.123"), 4.123);
  assert.equal(parseTimestamp("01:02:03.456"), 3_723.456);
  assert.ok(Number.isNaN(parseTimestamp("00:60.000")));
  assert.ok(Number.isNaN(parseTimestamp("01:60:00.000")));
  assert.ok(Number.isNaN(parseTimestamp("00:01.5")));
  assert.ok(Number.isNaN(parseTimestamp("not-a-time")));

  assert.deepEqual(
    parseWebVtt("WEBVTT\n\n00:60.000 --> 00:61.000\nInvalid timestamps"),
    [],
  );
});
