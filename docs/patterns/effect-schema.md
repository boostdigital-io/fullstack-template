# Patroon: Effect Schema

> Gebaseerd op `effect@4.1.2` (`repos/effect`, tag `effect@4.1.2`).

Value objects, entities en domeinfouten in `packages/domain`. Validatie gebeurt alleen met Effect Schema ([ADR 0011](../decisions/0011-effect-schema-only.md)). De regels per laag staan in [errors.md](../architecture/errors.md) en [conventions.md](../architecture/conventions.md).

## Hoe het hoort

### Value object met brand

Een value object is een schema met checks, afgesloten met `Schema.brand`. Exporteer het schema en het type onder dezelfde naam.

```ts
import { Schema } from "effect";

export const TodoId = Schema.String.check(Schema.isUUID(4)).pipe(Schema.brand("TodoId"));
export type TodoId = typeof TodoId.Type;

export const TodoTitle = Schema.Trimmed.check(Schema.isNonEmpty(), Schema.isMaxLength(120)).pipe(
  Schema.brand("TodoTitle"),
);
export type TodoTitle = typeof TodoTitle.Type;
```

- Checks gaan via `.check(...)` met de `Schema.is*`-filters: `isUUID`, `isNonEmpty`, `isMinLength`, `isMaxLength`, `isTrimmed`, `isPattern`. Je kunt er meerdere in één `.check` zetten.
- `Schema.brand` verandert alleen het TypeScript-type. De checks moeten er dus vóór staan.
- Een waarde maak je met `TodoId.make("…")`. Die valideert, en gooit bij ongeldige input. Gebruik dat alleen voor waarden die je zelf kent, zoals in tests. Input van buiten decodeer je.

### Entity

Een entity is een `Schema.Class`. Het type is de class zelf.

```ts
export class Todo extends Schema.Class<Todo>("Todo")({
  id: TodoId,
  title: TodoTitle,
  completed: Schema.Boolean,
}) {}

const todo = new Todo({ id, title, completed: false });
```

De constructor valideert de velden. Het type van de velden is het gebrande type, dus `new Todo({ id: "abc", … })` met een kale string compileert niet.

### Domeinfout

Een domeinfout is een `Schema.TaggedError`. `_tag` wordt automatisch gevuld met de eerste parameter.

```ts
export class TodoNotFound extends Schema.TaggedError<TodoNotFound>()("TodoNotFound", {
  id: TodoId,
}) {}
```

- Alleen veilige velden, zoals een ID: de fout gaat naar de client.
- Geen HTTP-status in het domein. De statuscode krijgt de fout in het contract (zie [effect-http-api.md](effect-http-api.md#endpoints-en-fouten)).
- Een `TaggedError` is direct te `yield*`en in `Effect.gen` of `Effect.fn`. Gebruik dan altijd `return yield*`, zodat TypeScript weet dat de functie daar stopt:

```ts
if (todo === undefined) {
  return yield* new TodoNotFound({ id });
}
```

### Decoderen aan de grens

Input van buiten (een request, een databaserij) decodeer je met de Effect-variant, zodat een fout getypt in het error-kanaal blijft:

```ts
const decodeTodo = Schema.decodeUnknownEffect(Todo);
```

In de API doet HttpApi dit al voor je, op basis van het contract. Zelf decoderen is alleen nodig bij data die niet via het contract binnenkomt.

## Wat je niet doet

- Geen `Data.TaggedError` voor domeinfouten: dat is geen schema en kan dus niet via het contract naar de client. `Schema.TaggedErrorClass` bestaat niet in 4.1.2; het heet `Schema.TaggedError`.
- Geen `{ httpApiStatus: 404 }` als annotatie op een domeinfout. Dat werkt technisch, maar zet HTTP in het domein ([ADR 0014](../decisions/0014-domain-errors-in-contract.md)).
- Geen `as TodoId` om een string tot value object te maken. Decodeer of gebruik `TodoId.make`.
- Geen Zod, geen eigen validatiefuncties naast het schema.
- Geen `Schema.decodeUnknownSync` in Effect-code: die gooit. Gebruik `decodeUnknownEffect`.
- Geen teksten voor gebruikers in een fout. De web-app kiest de woorden per `_tag` ([ADR 0015](../decisions/0015-translatable-messages.md)).

## Meer in `repos/effect`

- `ai-docs/src/01_effect/02_schema/10_schema-basics.ts`: `Schema.Class`, decoderen en encoderen.
- `ai-docs/src/01_effect/04_errors/`: fouten definiëren en afvangen (`catchTag`, `catchTags`).
- `packages/effect/src/Schema.ts`: `brand` (zoek op `export function brand`), `TaggedError` (`export const TaggedError`), en de filters (`export function isMaxLength`, `isUUID`, `isTrimmed`).
- `packages/effect/test/schema/Schema.test.ts`: gedrag van checks, brands en classes.
- `packages/effect/test/Brand.test.ts`: brands.
