// Bun dwingt `packageManager` niet af. Dit script doet dat wel, via `preinstall`.
import process from "node:process";

const pkg = await Bun.file(new URL("../package.json", import.meta.url)).json();
const [, expected] = /^bun@(?<version>\d+\.\d+\.\d+)$/u.exec(pkg.packageManager ?? "") ?? [];

if (expected === undefined) {
  console.error(
    `✖ package.json mist een geldige "packageManager": "bun@x.y.z" (gevonden: ${JSON.stringify(pkg.packageManager)}).`,
  );
  process.exit(1);
}

const actual = Bun.version;

if (actual !== expected) {
  console.error(
    [
      `✖ Verkeerde Bun-versie: je draait ${actual}, dit project vereist ${expected}.`,
      "  Installeer de juiste versie:",
      `    curl -fsSL https://bun.sh/install | bash -s "bun-v${expected}"`,
    ].join("\n"),
  );
  process.exit(1);
}
