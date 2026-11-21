// Preload voor `bun test` (bunfig.toml): stopt meteen, want tests draaien met Vitest (ADR 0016).
import process from "node:process";

console.error(
  "✖ Gebruik `bun run test` (Vitest), niet `bun test`. Zie docs/architecture/testing.md.",
);
process.exit(1);
