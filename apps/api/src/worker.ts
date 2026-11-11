import { Context } from "effect";

// De Worker krijgt env en ctx per request in fetch. index.ts geeft ze als Context mee aan de handler,
// zodat de per-request-Layers ze kunnen lezen en de typecheck faalt als ze ontbreken.
export class WorkerEnv extends Context.Service<WorkerEnv, Env>()("@repo/api/WorkerEnv") {}

export class WorkerContext extends Context.Service<WorkerContext, ExecutionContext>()(
  "@repo/api/WorkerContext",
) {}
