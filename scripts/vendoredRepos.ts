// Gedeelde logica voor `repos:sync` en `repos:check` (BOO-110).
//
// `repos/manifest.json` legt per vendored repo vast:
// - `url`: de git-remote.
// - `package`: het npm-package waarvan de versie in package.json bepaalt welke tag we vendoren.
// - `tagPattern`: hoe die versie een git-tag wordt; `{version}` wordt vervangen door de versie.
// - `tag` en `commit`: waar de subtree in `repos/<naam>` nu op staat. `repos:sync` werkt ze bij.
import { $ } from "bun";

const ROOT = new URL("..", import.meta.url).pathname;
const MANIFEST_PATH = `${ROOT}repos/manifest.json`;

const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u;
const SUBTREE_SPLIT = /^git-subtree-split: (?<commit>[0-9a-f]{40})$/mu;
const LS_REMOTE_LINE = /^(?<commit>[0-9a-f]{40})\t(?<ref>\S+)$/u;

interface RepoEntry {
  url: string;
  package: string;
  tagPattern: string;
  tag: string;
  commit: string;
}

type Manifest = Record<string, RepoEntry>;

interface RepoStatus {
  name: string;
  entry: RepoEntry;
  version: string;
  expectedTag: string;
  vendoredCommit: string | undefined;
}

class RepoError extends Error {}

const readManifest = async (): Promise<Manifest> =>
  (await Bun.file(MANIFEST_PATH).json()) as Manifest;

const writeManifest = async (manifest: Manifest): Promise<void> => {
  await Bun.write(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
};

const workspacePackageJsons = async (): Promise<string[]> => {
  const root = await Bun.file(`${ROOT}package.json`).json();
  const patterns: string[] = root.workspaces ?? [];
  const paths = patterns.flatMap((pattern) => [
    ...new Bun.Glob(`${pattern}/package.json`).scanSync({ cwd: ROOT }),
  ]);
  return paths.sort();
};

// Leest de versie van `pkg` uit alle workspaces. Die moet overal exact en gelijk zijn.
const installedVersion = async (pkg: string): Promise<string> => {
  const found = new Map<string, string>();
  for (const path of await workspacePackageJsons()) {
    // biome-ignore lint/performance/noAwaitInLoops: een handvol kleine bestanden, volgorde maakt niet uit.
    const json = await Bun.file(`${ROOT}${path}`).json();
    const spec: unknown = json.dependencies?.[pkg] ?? json.devDependencies?.[pkg];
    if (typeof spec === "string") {
      found.set(path, spec);
    }
  }

  if (found.size === 0) {
    throw new RepoError(`${pkg} staat in geen enkele workspace-package.json.`);
  }

  const specs = new Set(found.values());
  if (specs.size > 1) {
    const list = [...found].map(([path, spec]) => `    ${path}: ${spec}`).join("\n");
    throw new RepoError(`${pkg} heeft niet overal dezelfde versie:\n${list}`);
  }

  const [version = ""] = specs;
  if (!EXACT_VERSION.test(version)) {
    throw new RepoError(`${pkg} is niet exact vastgepind (gevonden: ${version}).`);
  }
  return version;
};

// De upstream-commit waar `repos/<naam>` op staat, volgens de laatste squash-commit van git subtree.
const vendoredCommit = async (name: string): Promise<string | undefined> => {
  const body = await $`git log -1 --grep=${`^git-subtree-dir: repos/${name}/*$`} --format=%B`
    .cwd(ROOT)
    .text();
  return SUBTREE_SPLIT.exec(body)?.groups?.commit;
};

const repoStatus = async (name: string, entry: RepoEntry): Promise<RepoStatus> => {
  const version = await installedVersion(entry.package);
  return {
    name,
    entry,
    version,
    expectedTag: entry.tagPattern.replaceAll("{version}", version),
    vendoredCommit: await vendoredCommit(name),
  };
};

const isInSync = (status: RepoStatus): boolean =>
  status.entry.tag === status.expectedTag && status.vendoredCommit === status.entry.commit;

// Zoekt de commit achter een tag op de remote. Bij een annotated tag is dat de `^{}`-regel.
const resolveTag = async (url: string, tag: string): Promise<string> => {
  const output = await $`git ls-remote --tags ${url} ${`refs/tags/${tag}`} ${`refs/tags/${tag}^{}`}`
    .cwd(ROOT)
    .text();
  const refs = new Map<string, string>();
  for (const line of output.split("\n")) {
    const match = LS_REMOTE_LINE.exec(line);
    if (match?.groups) {
      refs.set(match.groups.ref ?? "", match.groups.commit ?? "");
    }
  }

  const commit = refs.get(`refs/tags/${tag}^{}`) ?? refs.get(`refs/tags/${tag}`);
  if (commit === undefined) {
    throw new RepoError(`Tag ${tag} bestaat niet op ${url}. Klopt de tagPattern in het manifest?`);
  }
  return commit;
};

export type { Manifest, RepoEntry, RepoStatus };
export { isInSync, RepoError, ROOT, readManifest, repoStatus, resolveTag, writeManifest };
