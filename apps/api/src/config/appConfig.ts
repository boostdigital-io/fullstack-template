import { Config, Context, Effect, Layer, type LogLevel } from "effect";

export class AppConfig extends Context.Service<
  AppConfig,
  { readonly logLevel: LogLevel.LogLevel }
>()("@repo/api/AppConfig") {
  static readonly layer = Layer.effect(
    AppConfig,
    Effect.gen(function* () {
      // withDefault geldt alleen als LOG_LEVEL ontbreekt; een ongeldige waarde blijft een ConfigError.
      const logLevel = yield* Config.LogLevel("LOG_LEVEL").pipe(Config.withDefault("Info"));
      return AppConfig.of({ logLevel });
    }),
  );
}
