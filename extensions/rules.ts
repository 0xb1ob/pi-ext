import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { SUPERPOWERS_SKILLS } from "../scripts/patch-settings.mjs";

const rulesDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "rules");
const rule = (name: string) => readFileSync(join(rulesDir, name), "utf8").trim();

const onPath = (bin: string) =>
	spawnSync("sh", ["-c", `command -v ${bin}`], { stdio: "ignore" }).status === 0;

// ponytail: PATH probe once at load, restart pi after installing br/treehouse.
const hasTreehouse = onPath("treehouse");
const hasBr = onPath("br") || onPath("bd");

export function buildRules(cwd: string): string {
	const parts = [rule("style.md")];
	if (hasBr && existsSync(join(cwd, ".beads"))) parts.push(rule("beads.md"));
	if (hasTreehouse) parts.push(rule("treehouse.md"));
	return parts.join("\n\n");
}

const REQUIRED = [
	"@dietrichgebert/ponytail",
	"rpiv-ask-user-question",
	"pi-caveman",
	"pi-codex-image-gen",
	"pi-hashline-edit-pro",
	"pi-mcp-adapter",
	"pi-multimodal-proxy",
	"pi-web-access",
	"@tintinweb/pi-subagents",
];

export const SETUP_CMD =
	"curl -fsSL https://raw.githubusercontent.com/0xb1ob/pi-ext/main/scripts/setup.sh | bash";

const sourceOf = (pkg: unknown) =>
	typeof pkg === "string" ? pkg : pkg && typeof pkg === "object" && "source" in pkg ? String((pkg as { source: unknown }).source) : "";

export function companionGaps(packages: unknown[]): string[] {
	const gaps: string[] = [];
	for (const n of REQUIRED) {
		if (!packages.some((p) => sourceOf(p).includes(n))) gaps.push(n);
	}
	const sp = packages.find((p) => sourceOf(p).includes("superpowers"));
	const skills = sp && typeof sp === "object" ? (sp as { skills?: unknown }).skills : undefined;
	const exts = sp && typeof sp === "object" ? (sp as { extensions?: unknown }).extensions : undefined;
	if (!sp) gaps.push("superpowers");
	else if (
		!Array.isArray(exts) ||
		exts.length !== 0 ||
		!Array.isArray(skills) ||
		SUPERPOWERS_SKILLS.some((s) => !skills.includes(s)) ||
		skills.includes("using-superpowers")
	) {
		gaps.push("superpowers-filter");
	}
	return gaps;
}

function companionNotice(): string {
	try {
		const settings = JSON.parse(readFileSync(join(homedir(), ".pi/agent/settings.json"), "utf8"));
		const gaps = companionGaps(settings.packages ?? []);
		if (!gaps.length) return "";
		return `## pi-ext companions missing\n\nNeed: ${gaps.join(", ")}\n\nTell user to run, then restart pi:\n\n${SETUP_CMD}`;
	} catch {
		return "";
	}
}

export default function personalRules(pi: ExtensionAPI) {
	pi.on("before_agent_start", async (event) => {
		const extra = [buildRules(event.systemPromptOptions?.cwd ?? process.cwd()), companionNotice()]
			.filter(Boolean)
			.join("\n\n");
		return { systemPrompt: `${event.systemPrompt}\n\n${extra}` };
	});
}
