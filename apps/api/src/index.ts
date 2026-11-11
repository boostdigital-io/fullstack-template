import { Context } from "effect";
import { HttpRouter } from "effect/http";
import { ApiLayer } from "./layers";
import { WorkerContext, WorkerEnv } from "./worker";

const { handler } = HttpRouter.toWebHandler(ApiLayer);

export default {
  fetch: (request, env, ctx) =>
    handler(request, Context.make(WorkerEnv, env).pipe(Context.add(WorkerContext, ctx))),
} satisfies ExportedHandler<Env>;
