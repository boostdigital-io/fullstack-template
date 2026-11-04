// Controleert of een commitbericht Conventional Commits volgt. Aangeroepen vanuit `.husky/commit-msg`.
import process from "node:process";

const TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
] as const;

const MAX_HEADER_LENGTH = 100;

// Berichten die git zelf maakt, of die bij een rebase nog verdwijnen.
const SKIP_PATTERN = /^(?:Merge |Revert "|(?:fixup|squash|amend)! )/u;

const HEADER_PATTERN = new RegExp(`^(?:${TYPES.join("|")})(?:\\([^()\\s]+\\))?!?: \\S`, "u");

const EXAMPLE = "feat(api): voeg endpoint voor taken toe";

const [, , path] = process.argv;

if (path === undefined) {
  console.error("✖ Gebruik: bun scripts/commitMsg.ts <pad-naar-commitbericht>");
  process.exit(1);
}

const raw = await Bun.file(path).text();
const header =
  raw
    .split("\n")
    .filter((line) => !line.startsWith("#"))
    .find((line) => line.trim() !== "")
    ?.trimEnd() ?? "";

const fail = (reason: string): never => {
  console.error(
    [
      `✖ Ongeldig commitbericht: ${reason}`,
      `  Gekregen:    ${header}`,
      "  Verwacht:    type(scope)!: onderwerp   (scope en ! zijn optioneel)",
      `  Types:       ${TYPES.join(", ")}`,
      `  Voorbeeld:   ${EXAMPLE}`,
    ].join("\n"),
  );
  process.exit(1);
};

if (header === "") {
  fail("het bericht is leeg.");
}

if (!SKIP_PATTERN.test(header)) {
  if (header.length > MAX_HEADER_LENGTH) {
    fail(`de eerste regel is ${header.length} tekens, maximaal ${MAX_HEADER_LENGTH}.`);
  }

  if (!HEADER_PATTERN.test(header)) {
    fail("de eerste regel volgt Conventional Commits niet.");
  }
}
