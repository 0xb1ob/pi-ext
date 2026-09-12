// node test.mjs  — checks conditional rule injection
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildRules } from "./extensions/rules.ts";
import { patchPackages, SUPERPOWERS_SKILLS } from "./scripts/patch-settings.mjs";

const plain = mkdtempSync(join(tmpdir(), "pe-"));
const beads = mkdtempSync(join(tmpdir(), "pe-"));
mkdirSync(join(beads, ".beads"));

assert.ok(buildRules(plain).includes("Personal working rules"), "style rules always injected");
assert.ok(!buildRules(plain).includes("br ready"), "no beads rules without .beads/");

const withBeads = buildRules(beads).includes("br ready");
console.log(`beads rules in .beads/ repo: ${withBeads} (false is correct when br is not installed)`);

const patched = patchPackages([
	"/Users/x/personal-extensions",
	"npm:@dietrichgebert/ponytail@4.9.0",
	"git:github.com/obra/superpowers@v6.3.0",
]);
const sp = patched.find((p) => (typeof p === "string" ? p : p.source).includes("superpowers"));
assert.equal(typeof sp, "object");
assert.deepEqual(sp.extensions, []);
assert.deepEqual(sp.skills, SUPERPOWERS_SKILLS);
assert.ok(!sp.skills.includes("using-superpowers"));
assert.equal(patched[1], "npm:@dietrichgebert/ponytail@4.9.0");
assert.deepEqual(
	patchPackages([{ source: "git:github.com/obra/superpowers@v6.3.0", extensions: ["./x"] }])[0].extensions,
	[],
);

console.log("ok");
