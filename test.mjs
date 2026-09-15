// node test.mjs  — checks conditional rule injection
import assert from "node:assert/strict";
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { augment, buildRules, companionGaps } from "./extensions/rules.ts";
import { linkPackageSkills, patchPackages, SUPERPOWERS_SKILLS } from "./scripts/patch-settings.mjs";

const plain = mkdtempSync(join(tmpdir(), "pe-"));
const beads = mkdtempSync(join(tmpdir(), "pe-"));
mkdirSync(join(beads, ".beads"));

assert.ok(buildRules(plain).includes("Personal working rules"), "style rules always injected");
assert.ok(!buildRules(plain).includes("br ready"), "no beads rules without .beads/");

// Append-mode subagents inherit the parent prompt, then load this extension again.
const once = augment("BASE PROMPT", plain);
assert.ok(once.includes("Personal working rules"), "rules appended to a clean prompt");
assert.equal(augment(once, plain), undefined, "no second append when rules are already present");

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

assert.deepEqual(
	companionGaps([]).sort(),
	[
		"@dietrichgebert/ponytail",
		"@tintinweb/pi-subagents",
		"pi-caveman",
		"pi-codex-image-gen",
		"pi-hashline-edit-pro",
		"pi-mcp-adapter",
		"pi-multimodal-proxy",
		"pi-web-access",
		"rpiv-ask-user-question",
		"superpowers",
	].sort(),
);
assert.deepEqual(
	companionGaps(
		[
			"npm:@dietrichgebert/ponytail@4.9.0",
			"npm:@juicesharp/rpiv-ask-user-question@2.9.0",
			"npm:pi-caveman@1.0.8",
			"npm:pi-codex-image-gen@0.1.12",
			"npm:pi-hashline-edit-pro@4.3.2",
			"npm:pi-mcp-adapter@2.33.0",
			"npm:pi-multimodal-proxy@1.18.1",
			"npm:pi-web-access@0.27.0",
			"npm:@tintinweb/pi-subagents",
			"git:github.com/obra/superpowers@v6.3.0",
		],
	),
	["superpowers-filter"],
);
assert.deepEqual(
	companionGaps(
		[
			"npm:@dietrichgebert/ponytail@4.9.0",
			"npm:@juicesharp/rpiv-ask-user-question@2.9.0",
			"npm:pi-caveman@1.0.8",
			"npm:pi-codex-image-gen@0.1.12",
			"npm:pi-hashline-edit-pro@4.3.2",
			"npm:pi-mcp-adapter@2.33.0",
			"npm:pi-multimodal-proxy@1.18.1",
			"npm:pi-web-access@0.27.0",
			"npm:@tintinweb/pi-subagents",
			{ source: "git:github.com/obra/superpowers@v6.3.0", extensions: [], skills: SUPERPOWERS_SKILLS },
		],
	),
	[],
);

const agent = mkdtempSync(join(tmpdir(), "pe-agent-"));
const pony = join(agent, "npm/node_modules/@dietrichgebert/ponytail/skills/ponytail");
mkdirSync(pony, { recursive: true });
writeFileSync(join(pony, "SKILL.md"), "---\nname: ponytail\ndescription: x\n---\n");
mkdirSync(join(agent, "skills/keep-me"), { recursive: true });
writeFileSync(join(agent, "skills/keep-me/SKILL.md"), "real\n");
assert.deepEqual(linkPackageSkills(agent), ["ponytail"]);
assert.equal(readlinkSync(join(agent, "skills/ponytail")), pony);
assert.ok(!lstatSync(join(agent, "skills/keep-me")).isSymbolicLink());
assert.deepEqual(linkPackageSkills(agent), ["ponytail"]);

const setup = readFileSync(new URL("./scripts/setup.sh", import.meta.url), "utf8");
assert.match(setup, /install git:github.com\/0xb1ob\/pi-ext@v1/);
assert.ok(!setup.includes("has_pkg"), "setup always installs pi-ext, no skip");
for (const n of ["pi-codex-image-gen", "pi-multimodal-proxy"]) {
	assert.ok(setup.includes(n), `setup installs ${n}`);
}

console.log("ok");
