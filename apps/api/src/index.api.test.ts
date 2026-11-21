import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { unstable_startWorker } from "wrangler";

// wrangler leest .dev.vars naast deze config; zo hangt het pad niet af van de werkmap.
const WRANGLER_CONFIG = fileURLToPath(new URL("../wrangler.jsonc", import.meta.url).href);

// De echte Worker in workerd, gestart door wrangler met wrangler.jsonc. Hyperdrive wijst naar de
// testdatabase via CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE (vitest.config.ts).
let worker: Awaited<ReturnType<typeof unstable_startWorker>>;

beforeAll(async () => {
  worker = await unstable_startWorker({
    config: WRANGLER_CONFIG,
    dev: { server: { port: 0 }, inspector: false, logLevel: "error" },
  });
});

afterAll(async () => {
  await worker.dispose();
});

describe("Worker", () => {
  it("geeft 404 op een onbekend pad", async () => {
    const response = await worker.fetch("http://localhost/bestaat-niet");
    expect(response.status).toBe(404);
  });
});
