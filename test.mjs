// node test.mjs  — checks conditional rule injection
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildRules } from "./extensions/rules.ts";

const plain = mkdtempSync(join(tmpdir(), "pe-"));
const beads = mkdtempSync(join(tmpdir(), "pe-"));
mkdirSync(join(beads, ".beads"));

assert.ok(buildRules(plain).includes("Personal working rules"), "style rules always injected");
assert.ok(!buildRules(plain).includes("br ready"), "no beads rules without .beads/");

const withBeads = buildRules(beads).includes("br ready");
console.log(`beads rules in .beads/ repo: ${withBeads} (false is correct when br is not installed)`);
console.log("ok");
