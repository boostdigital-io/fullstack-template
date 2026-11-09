// PostToolUse-hook (BOO-113): draait `biome check --write` op elk bestand dat Claude bewerkt.
// Wat Biome niet zelf kan oplossen, gaat via stderr en exitcode 2 terug naar Claude, zodat die het
// in dezelfde stap oplost. Bestanden die Biome niet controleert (Markdown, `repos/`, ignores)
// laten we stil passeren.
import { realpath } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { $ } from "bun";

const ROOT = await realpath(fileURLToPath(new URL("../..", import.meta.url)));

const field = (value: unknown, key: string): unknown =>
  typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined;

// Biome eist dat het bestand onder de root ligt. Loopt een van beide via een symlink (bijv. `/tmp`
// naar `/private/tmp` op macOS), dan klopt dat alleen als we beide naar hun echte pad omzetten.
const check = async (filePath: string): Promise<string | undefined> => {
  const result =
    await $`bunx biome check --write --colors=off --no-errors-on-unmatched --files-ignore-unknown=true ${await realpath(filePath)}`
      .cwd(ROOT)
      .nothrow()
      .quiet();
  if (result.exitCode === 0) {
    return;
  }
  return `Biome kon niet alles in ${filePath} zelf oplossen. Los dit op:\n${result.stdout.toString()}${result.stderr.toString()}`;
};

try {
  const filePath = field(field(await Bun.stdin.json(), "tool_input"), "file_path");
  const problem = typeof filePath === "string" ? await check(filePath) : undefined;
  if (problem !== undefined) {
    console.error(problem);
    process.exit(2);
  }
} catch (error) {
  // Exitcode 1 ziet Claude Code als een fout die het werk niet stopt; dan draait Biome niet en
  // merkt niemand het. Met 2 krijgt Claude de melding te zien.
  console.error(`biomeCheck faalde: ${String(error)}`);
  process.exit(2);
}
