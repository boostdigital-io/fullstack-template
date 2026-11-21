// Controleert of een commitbericht Conventional Commits volgt. Puur, zodat Vitest het kan testen;
// het Bun-deel voor de commit-msg-hook staat in `commitMsgHook.ts`.

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

// De eerste regel die geen commentaar van git is en niet leeg.
const commitHeader = (raw: string): string =>
  raw
    .split("\n")
    .filter((line) => !line.startsWith("#"))
    .find((line) => line.trim() !== "")
    ?.trimEnd() ?? "";

// Geeft de reden terug als het bericht ongeldig is, anders undefined.
const checkCommitMessage = (raw: string): string | undefined => {
  const header = commitHeader(raw);

  if (header === "") {
    return "het bericht is leeg.";
  }
  if (SKIP_PATTERN.test(header)) {
    return;
  }
  if (header.length > MAX_HEADER_LENGTH) {
    return `de eerste regel is ${header.length} tekens, maximaal ${MAX_HEADER_LENGTH}.`;
  }
  if (!HEADER_PATTERN.test(header)) {
    return "de eerste regel volgt Conventional Commits niet.";
  }
};

export { checkCommitMessage, commitHeader, TYPES };
