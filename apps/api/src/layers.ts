import { Api } from "@repo/contract";
import { ConfigProvider, Effect, Layer } from "effect";
import { HttpRouter, HttpServer } from "effect/http";
import { HttpApiBuilder } from "effect/http-api";
import { AppConfig } from "./config/appConfig";
import { Database } from "./db/database";
import { WorkerEnv } from "./worker";

// Config komt uit het env-object van deze request. fromUnknown, omdat env ook bindings bevat
// (zoals HYPERDRIVE) en dus geen Record<string, string> is.
const ConfigFromEnv = Layer.unwrap(
  Effect.gen(function* () {
    const env = yield* WorkerEnv;
    return ConfigProvider.layer(ConfigProvider.fromUnknown(env));
  }),
);

const PerRequestLayer = Layer.mergeAll(AppConfig.layer, Database.layer).pipe(
  Layer.provide(ConfigFromEnv),
);

// Globaal: een route-middleware mag geen per-request-service als WorkerEnv opvragen. Zo faalt een
// configfout ook elke request, een 404 inbegrepen.
const RequestServices = HttpRouter.middleware<{ provides: AppConfig | Database }>()(
  (httpEffect) =>
    Effect.gen(function* () {
      const services = yield* Layer.build(PerRequestLayer);
      return yield* Effect.provideContext(httpEffect, services);
    }),
  { global: true },
);

export const ApiLayer = HttpApiBuilder.layer(Api).pipe(
  Layer.provide(RequestServices),
  Layer.provide(HttpServer.layerServices),
);
