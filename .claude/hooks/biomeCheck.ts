// PostToolUse-hook (BOO-113): draait `biome check --write` op elk bestand dat Claude bewerkt.
// Wat Biome niet zelf kan oplossen, gaat via stderr en exitcode 2 terug naar Claude, zodat die het
// in dezelfde stap oplost. Bestanden die Biome niet controleert (Markdown, `repos/`, ignores)
// laten we stil passeren.
import process from "node:process";
import { $ } from "bun";

const ROOT = new URL("../..", import.meta.url).pathname;

const field = (value: unknown, key: string): unknown =>
  typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined;

const filePath = field(field(await Bun.stdin.json(), "tool_input"), "file_path");
if (typeof filePath !== "string") {
  process.exit(0);
}

const result =
  await $`bunx biome check --write --colors=off --no-errors-on-unmatched --files-ignore-unknown=true ${filePath}`
    .cwd(ROOT)
    .nothrow()
    .quiet();

if (result.exitCode !== 0) {
  console.error(
    `Biome kon niet alles in ${filePath} zelf oplossen. Los dit op:\n${result.stdout.toString()}${result.stderr.toString()}`,
  );
  process.exit(2);
}
