// PreToolUse-hook (BOO-113): weigert `git push` naar `main`. De deny-regels in settings.json
// vangen alleen vaste vormen; `git push` vanaf `main` of `git -C . push origin main` niet.
// Dit voorkomt vergissingen; de echte poort is de ruleset op `main` (ADR 0013).
import { resolve } from "node:path";
import process from "node:process";
import { $ } from "bun";

const PROTECTED = "main";
const SEPARATOR = /&&|\|\||[;|&\n]/u;
const PUSH =
  /^\s*git\s+(?<globals>(?:(?:-[Cc]|--git-dir|--work-tree)(?:=|\s+)\S+\s+)*)push\b(?<args>.*)$/u;
const DIRECTORY = /-C\s+(?<dir>\S+)/u;
const GIT_DIR = /--git-dir(?:=|\s+)(?<gitDir>\S+)/u;
const WHITESPACE = /\s+/u;
const MENTIONS_PUSH = /\bpush\b/u;
const REF_PREFIX = /^\+?(?:refs\/heads\/)?/u;
const PUSHES_EVERYTHING = new Set(["--all", "--mirror"]);

const field = (value: unknown, key: string): unknown =>
  typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined;

const currentBranch = async (directory: string, gitDir: string | undefined): Promise<string> => {
  const gitDirOption = gitDir === undefined ? [] : ["--git-dir", gitDir];
  const result = await $`git ${gitDirOption} rev-parse --abbrev-ref HEAD`
    .cwd(directory)
    .nothrow()
    .quiet();
  return result.stdout.toString().trim();
};

const branchName = (ref: string): string => ref.replace(REF_PREFIX, "");

// De branches op de remote die deze push bijwerkt, voor zover dat uit de regel te halen is.
// Zonder refspec pusht git de huidige branch.
const pushTargets = (args: string[], branch: string): string[] => {
  if (args.some((arg) => PUSHES_EVERYTHING.has(arg))) {
    return [PROTECTED];
  }
  const refspecs = args.filter((arg) => !arg.startsWith("-")).slice(1);
  if (refspecs.length === 0) {
    return [branch];
  }
  return refspecs.map((refspec) => {
    const [source = "", destination] = refspec.split(":");
    const target = branchName(destination ?? source);
    return target === "HEAD" ? branch : target;
  });
};

// Geeft het eerste push-commando terug dat naar `main` pusht, of undefined.
const pushToProtected = async (stdin: string): Promise<string | undefined> => {
  const input: unknown = JSON.parse(stdin);
  const command = field(field(input, "tool_input"), "command");
  const cwdField = field(input, "cwd");
  const cwd = typeof cwdField === "string" ? cwdField : process.cwd();
  if (typeof command !== "string") {
    return;
  }

  const pushes = command.split(SEPARATOR).flatMap((segment) => {
    const groups = PUSH.exec(segment)?.groups;
    return groups === undefined ? [] : [{ segment: segment.trim(), groups }];
  });

  for (const { segment, groups } of pushes) {
    const globals = groups.globals ?? "";
    const dir = DIRECTORY.exec(globals)?.groups?.dir;
    const gitDir = GIT_DIR.exec(globals)?.groups?.gitDir;
    // biome-ignore lint/performance/noAwaitInLoops: meestal één push per commando.
    const branch = await currentBranch(dir === undefined ? cwd : resolve(cwd, dir), gitDir);
    const args = (groups.args ?? "").trim().split(WHITESPACE).filter(Boolean);
    if (pushTargets(args, branch).includes(PROTECTED)) {
      return segment;
    }
  }
};

const raw = await Bun.stdin.text();

try {
  const segment = await pushToProtected(raw);
  if (segment !== undefined) {
    console.error(
      `Geweigerd: \`${segment}\` pusht naar ${PROTECTED}. Push naar een eigen branch en open een PR (ADR 0013).`,
    );
    process.exit(2);
  }
} catch (error) {
  // Kan de hook een commando met `push` niet beoordelen, dan weigeren we het liever. Andere
  // commando's laten we door, zodat een kapotte hook niet elk shell-commando blokkeert.
  console.error(`guardGitPush faalde: ${String(error)}`);
  process.exit(MENTIONS_PUSH.test(raw) ? 2 : 1);
}
