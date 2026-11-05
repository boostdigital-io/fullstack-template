// Controleert of elke vendored repo in `repos/` op de versie uit package.json staat. Werkt offline.
// Herstellen: `bun run repos:sync`.
import process from "node:process";
import { isInSync, RepoError, type RepoStatus, readManifest, repoStatus } from "./vendoredRepos.ts";

const explain = (status: RepoStatus): string => {
  const { name, entry, version, expectedTag, vendoredCommit } = status;
  if (entry.tag !== expectedTag) {
    return `repos/${name} staat op ${entry.tag}, maar package.json vraagt ${entry.package}@${version} (tag ${expectedTag}).`;
  }
  if (vendoredCommit === undefined) {
    return `repos/${name} is geen git subtree, of de squash-commit ontbreekt.`;
  }
  return `repos/${name} staat op commit ${vendoredCommit}, maar het manifest zegt ${entry.commit} (${entry.tag}).`;
};

const manifest = await readManifest();
const problems: string[] = [];

for (const [name, entry] of Object.entries(manifest)) {
  try {
    // biome-ignore lint/performance/noAwaitInLoops: vier repos, de uitvoer blijft zo op volgorde.
    const status = await repoStatus(name, entry);
    if (isInSync(status)) {
      console.log(`✔ repos/${name} staat op ${entry.tag}.`);
    } else {
      problems.push(explain(status));
    }
  } catch (error) {
    if (!(error instanceof RepoError)) {
      throw error;
    }
    problems.push(`repos/${name}: ${error.message}`);
  }
}

if (problems.length > 0) {
  console.error(
    [
      ...problems.map((problem) => `✖ ${problem}`),
      "  Zet de vendored repos gelijk met package.json: bun run repos:sync",
    ].join("\n"),
  );
  process.exit(1);
}
