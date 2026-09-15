import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";
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

const NPM_SKILL_PACKAGES = ["@dietrichgebert/ponytail", "pi-codex-image-gen", "pi-mcp-adapter"];

function skillDirsUnder(root) {
	if (!existsSync(root)) return [];
	return readdirSync(root, { withFileTypes: true })
		.filter((e) => e.isDirectory() || e.isSymbolicLink())
		.map((e) => join(root, e.name))
		.filter((p) => existsSync(join(p, "SKILL.md")));
}

export function packageSkillDirs(agentDir) {
	const npm = join(agentDir, "npm/node_modules");
	const dirs = NPM_SKILL_PACKAGES.flatMap((pkg) => skillDirsUnder(join(npm, pkg, "skills")));
	const sp = join(agentDir, "git/github.com/obra/superpowers/skills");
	for (const name of SUPERPOWERS_SKILLS) {
		const src = join(sp, name);
		if (existsSync(join(src, "SKILL.md"))) dirs.push(src);
	}
	return dirs;
}

// ponytail: symlink not copy. Pi follows + dedupes by realpath. pi-subagents preload skips symlink dirs.
export function linkPackageSkills(agentDir) {
	const destRoot = join(agentDir, "skills");
	mkdirSync(destRoot, { recursive: true });
	const linked = [];
	for (const src of packageSkillDirs(agentDir)) {
		const dest = join(destRoot, basename(src));
		try {
			if (lstatSync(dest).isSymbolicLink()) unlinkSync(dest);
			else continue; // real dir — leave it
		} catch {
			/* dest missing */
		}
		symlinkSync(src, dest);
		linked.push(basename(src));
	}
	return linked;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
	const file = process.argv[2] ?? join(homedir(), ".pi/agent/settings.json");
	const next = patchSettings(JSON.parse(readFileSync(file, "utf8")));
	writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
	const sp = next.packages.find((p) => sourceOf(p).includes("superpowers"));
	if (!sp) console.error("warn: no superpowers package in settings");
	else console.log(`patched ${file}: superpowers extension off, ${sp.skills.length} skills kept`);
	const linked = linkPackageSkills(join(homedir(), ".pi/agent"));
	if (linked.length) console.log(`linked skills → ~/.pi/agent/skills: ${linked.join(", ")}`);
}
