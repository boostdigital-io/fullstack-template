import { existsSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const DEV_VARS = fileURLToPath(new URL("apps/api/.dev.vars", import.meta.url));

// Lokaal komt TEST_DATABASE_URL uit apps/api/.dev.vars; in CI zet de workflow hem (BOO-134).
if (process.env.TEST_DATABASE_URL === undefined && existsSync(DEV_VARS)) {
  process.loadEnvFile(DEV_VARS);
}

const INTEGRATION = "**/*.integration.test.ts";
const API = "**/*.api.test.ts";

// Maakt de testdatabase aan en migreert hem. Faalt als TEST_DATABASE_URL ontbreekt of niet naar een
// database op _test wijst, zodat er nooit tests tegen de dev-database draaien.
const GLOBAL_SETUP = "apps/api/src/testing/globalSetup.ts";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["{apps,packages}/*/{src,example}/**/*.test.ts", "scripts/**/*.test.ts"],
          exclude: ["**/node_modules/**", INTEGRATION, API],
        },
      },
      {
        test: {
          name: "integration",
          include: [`{apps,packages}/*/{src,example}/${INTEGRATION}`],
          globalSetup: [GLOBAL_SETUP],
        },
      },
      {
        test: {
          name: "api",
          include: [`apps/api/{src,example}/${API}`],
          globalSetup: [GLOBAL_SETUP],
          // Officiële override van wrangler: de Hyperdrive-binding wijst naar de testdatabase in plaats
          // van naar localConnectionString (de dev-database) in wrangler.jsonc.
          env: {
            // biome-ignore lint/style/useNamingConvention: naam van een omgevingsvariabele van wrangler.
            CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE:
              process.env.TEST_DATABASE_URL ?? "",
          },
          // Een Worker opstarten duurt langer dan de standaard van 10 seconden toelaat op een trage CI-runner.
          hookTimeout: 30_000,
        },
      },
    ],
  },
});
