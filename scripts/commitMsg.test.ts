import { describe, expect, it } from "vitest";
import { checkCommitMessage } from "./commitMsg";

const NOT_CONVENTIONAL = "de eerste regel volgt Conventional Commits niet.";

const VALID = [
  ["zonder scope", "feat: voeg taken toe"],
  ["met scope", "fix(api): herstel 404 bij onbekend pad"],
  ["met !", "feat!: verwijder oude endpoint"],
  ["met scope en !", "refactor(contract)!: hernoem groep"],
  ["met body", "docs: werk testing.md bij\n\nMet uitleg over de testdatabase."],
  ["met Refs-footer", "test(api): voeg smoke-test toe\n\nRefs: BOO-120"],
  ["met commentaar van git erboven", "# Please enter the commit message\nci: draai unit-tests"],
  ["van precies 100 tekens", `chore: ${"a".repeat(93)}`],
] as const;

const INVALID = [
  ["een leeg bericht", "", "het bericht is leeg."],
  ["alleen commentaar", "# alleen commentaar\n\n", "het bericht is leeg."],
  ["zonder type", "voeg taken toe", NOT_CONVENTIONAL],
  ["met onbekend type", "feature: voeg taken toe", NOT_CONVENTIONAL],
  ["met hoofdletter-type", "Feat: voeg taken toe", NOT_CONVENTIONAL],
  ["zonder spatie na de dubbele punt", "feat:voeg taken toe", NOT_CONVENTIONAL],
  ["zonder onderwerp", "feat: ", NOT_CONVENTIONAL],
  ["met lege scope", "feat(): voeg taken toe", NOT_CONVENTIONAL],
  ["met spatie in de scope", "feat(my api): voeg taken toe", NOT_CONVENTIONAL],
  ["van 101 tekens", `chore: ${"a".repeat(94)}`, "de eerste regel is 101 tekens, maximaal 100."],
] as const;

const SKIPPED = [
  ["merge-commit", "Merge branch 'main' into guus/boo-120-vitest-opzet"],
  ["revert-commit", 'Revert "feat: voeg taken toe"'],
  ["fixup-commit", "fixup! feat: voeg taken toe"],
  ["squash-commit", "squash! feat: voeg taken toe"],
  ["amend-commit", "amend! feat: voeg taken toe"],
  ["lange merge-commit", `Merge branch '${"a".repeat(120)}'`],
] as const;

describe("checkCommitMessage", () => {
  it.each(VALID)("keurt een geldig bericht %s goed", (_, message) => {
    expect(checkCommitMessage(message)).toBeUndefined();
  });

  it.each(INVALID)("keurt %s af", (_, message, reason) => {
    expect(checkCommitMessage(message)).toBe(reason);
  });

  it.each(SKIPPED)("slaat een %s over", (_, message) => {
    expect(checkCommitMessage(message)).toBeUndefined();
  });
});
