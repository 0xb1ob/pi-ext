import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const SUPERPOWERS_SKILLS = [
	"brainstorming",
	"receiving-code-review",
	"requesting-code-review",
	"systematic-debugging",
	"test-driven-development",
	"verification-before-completion",
	"writing-plans",
	"writing-skills",
];

const sourceOf = (pkg) => (typeof pkg === "string" ? pkg : pkg.source);

export function patchPackages(packages) {
	return packages.map((pkg) => {
		const source = sourceOf(pkg);
		if (!source?.includes("superpowers")) return pkg;
		return { source, extensions: [], skills: [...SUPERPOWERS_SKILLS] };
	});
}

export function patchSettings(settings) {
	if (!Array.isArray(settings.packages)) return settings;
	return { ...settings, packages: patchPackages(settings.packages) };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
	const file = process.argv[2] ?? join(homedir(), ".pi/agent/settings.json");
	const next = patchSettings(JSON.parse(readFileSync(file, "utf8")));
	writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
	const sp = next.packages.find((p) => sourceOf(p).includes("superpowers"));
	if (!sp) console.error("warn: no superpowers package in settings");
	else console.log(`patched ${file}: superpowers extension off, ${sp.skills.length} skills kept`);
}
