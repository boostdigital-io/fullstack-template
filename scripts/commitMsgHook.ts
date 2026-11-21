// Aangeroepen vanuit `.husky/commit-msg`. Leest het bericht en meldt wat `checkCommitMessage` afkeurt.
import process from "node:process";
import { checkCommitMessage, commitHeader, TYPES } from "./commitMsg";

const EXAMPLE = "feat(api): voeg endpoint voor taken toe";

const [, , path] = process.argv;

if (path === undefined) {
  console.error("✖ Gebruik: bun scripts/commitMsgHook.ts <pad-naar-commitbericht>");
  process.exit(1);
}

const raw = await Bun.file(path).text();
const reason = checkCommitMessage(raw);

if (reason !== undefined) {
  console.error(
    [
      `✖ Ongeldig commitbericht: ${reason}`,
      `  Gekregen:    ${commitHeader(raw)}`,
      "  Verwacht:    type(scope)!: onderwerp   (scope en ! zijn optioneel)",
      `  Types:       ${TYPES.join(", ")}`,
      `  Voorbeeld:   ${EXAMPLE}`,
    ].join("\n"),
  );
  process.exit(1);
}
