import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

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

export default function personalRules(pi: ExtensionAPI) {
	pi.on("before_agent_start", async (event) => ({
		systemPrompt: `${event.systemPrompt}\n\n${buildRules(event.systemPromptOptions?.cwd ?? process.cwd())}`,
	}));
}
