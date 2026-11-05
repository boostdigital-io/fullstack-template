// Zet elke vendored repo in `repos/` op de git-tag die hoort bij de versie uit package.json, en
// werkt `repos/manifest.json` bij. Staat alles al goed, dan doet het niets.
// Vereist een schone werkmap: git subtree maakt zelf commits.
import { existsSync } from "node:fs";
import process from "node:process";
import { $ } from "bun";
import {
  isInSync,
  RepoError,
  type RepoStatus,
  ROOT,
  readManifest,
  repoStatus,
  resolveTag,
  writeManifest,
} from "./vendoredRepos.ts";

const fail = (message: string): never => {
  console.error(`✖ ${message}`);
  process.exit(1);
};

const manifest = await readManifest();
const outdated: RepoStatus[] = [];

for (const [name, entry] of Object.entries(manifest)) {
  try {
    // biome-ignore lint/performance/noAwaitInLoops: vier repos, de uitvoer blijft zo op volgorde.
    const status = await repoStatus(name, entry);
    if (isInSync(status)) {
      console.log(`✔ repos/${name} staat al op ${entry.tag}.`);
    } else {
      outdated.push(status);
    }
  } catch (error) {
    if (error instanceof RepoError) {
      fail(`repos/${name}: ${error.message}`);
    }
    throw error;
  }
}

if (outdated.length > 0) {
  const dirty = await $`git status --porcelain`.cwd(ROOT).text();
  if (dirty.trim() !== "") {
    fail("De werkmap is niet schoon. Commit of stash je wijzigingen en draai repos:sync opnieuw.");
  }

  for (const { name, entry, expectedTag, vendoredCommit } of outdated) {
    // biome-ignore lint/performance/noAwaitInLoops: git subtree-operaties moeten na elkaar.
    const commit = await resolveTag(entry.url, expectedTag).catch((error: unknown) =>
      error instanceof RepoError ? fail(`repos/${name}: ${error.message}`) : Promise.reject(error),
    );

    if (vendoredCommit === commit) {
      console.log(
        `• repos/${name} staat al op ${expectedTag}, alleen het manifest wordt bijgewerkt.`,
      );
    } else {
      const prefix = `repos/${name}`;
      const action = existsSync(`${ROOT}${prefix}`) ? "pull" : "add";
      const message = `chore(repos): ${action === "add" ? "add" : "update"} ${name} to ${expectedTag}`;
      console.log(`• repos/${name}: ${entry.tag} → ${expectedTag}`);
      await $`git subtree ${action} --prefix ${prefix} ${entry.url} ${expectedTag} --squash -m ${message}`.cwd(
        ROOT,
      );
    }

    manifest[name] = { ...entry, tag: expectedTag, commit };
  }

  await writeManifest(manifest);
  const names = outdated.map(({ name }) => name).join(", ");
  await $`git add repos/manifest.json`.cwd(ROOT);
  await $`git commit -m ${`chore(repos): record ${names} in manifest`}`.cwd(ROOT);
  console.log(`✔ Bijgewerkt: ${names}.`);
}
