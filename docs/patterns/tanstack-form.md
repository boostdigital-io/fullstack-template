# Patroon: TanStack Form

> Gebaseerd op `@tanstack/react-form@1.33.5` (geïnstalleerde package; niet gevendord, zie [ADR 0012](../decisions/0012-vendored-repos.md)).

Formulieren in `apps/web`. Ze valideren in de browser met dezelfde schema's als het contract; de server valideert opnieuw (zie [errors.md](../architecture/errors.md#in-de-web-app)). Validatie gaat alleen met Effect Schema ([ADR 0011](../decisions/0011-effect-schema-only.md)).

## Hoe het hoort

### Het contract-schema als validator

TanStack Form accepteert een Standard Schema als validator, en Effect Schema kan er een worden met `Schema.toStandardSchemaV1`. Het formulier gebruikt dus het payload-schema uit het contract, zonder eigen validatieregels.

```tsx
// features/todos/TodoForm.tsx
import { useForm } from "@tanstack/react-form";
import { Schema } from "effect";

const CreateTodoPayloadStandard = Schema.toStandardSchemaV1(CreateTodoPayload);
const decodeCreateTodoPayload = Schema.decodeSync(CreateTodoPayload);

export function TodoForm() {
  const createTodo = useCreateTodo();
  const form = useForm({
    defaultValues: { title: "" },
    validators: { onChange: CreateTodoPayloadStandard },
    onSubmit: async ({ value }) => {
      await createTodo.mutateAsync(decodeCreateTodoPayload(value));
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="title">
        {(field) => (
          <div>
            <input
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            {field.state.meta.errors.map((issue) => (
              <span key={issue?.message}>{issue?.message}</span>
            ))}
          </div>
        )}
      </form.Field>
      <button type="submit" disabled={createTodo.isPending}>
        Opslaan
      </button>
    </form>
  );
}
```

- **`CreateTodoPayload`** is `Schema.Struct({ title: TodoTitle })` uit het contract. `defaultValues` heeft de encoded vorm (een gewone `string`); het schema valideert die en kent de fouten per veld toe op basis van het pad.
- **`onSubmit`** krijgt de ruwe waarden, niet de geparste. Decodeer ze daarom met `Schema.decodeSync(CreateTodoPayload)` voordat je de mutatie aanroept: pas dan heb je de value objects (`TodoTitle`) die de client verwacht. Omdat de validator al geslaagd is, kan `decodeSync` hier niet falen.
- **`form.Field`** met `name` is getypeerd: een veld dat niet in `defaultValues` staat, compileert niet. `field.state.value` heeft het type van dat veld.
- **Fouten** in `field.state.meta.errors` zijn Standard Schema-issues, met een `message`.
- `effect` komt in `apps/web` met BOO-128 (voor de Effect-client). Dit voorbeeld is getypecheckt met dezelfde schema's via het contract.

### Fouten van de server

Een verwachte fout van de API (zoals `TodoTitleTaken`) komt terug via de mutatie. Toon hem bij het formulier, met de melding voor die `_tag` uit `features/todos/messages.ts` ([ADR 0015](../decisions/0015-translatable-messages.md)). Onverwachte fouten krijgen de algemene melding.

## Wat je niet doet

- Geen eigen validatiefuncties of regels naast het contract-schema; dan lopen client en server uiteen.
- Geen Zod, en geen `@tanstack/zod-form-adapter`.
- Geen ruwe formulierwaarden naar de mutatie; altijd eerst decoderen.
- Geen `as TodoTitle` om de types kloppend te krijgen.
- Geen formulierstate in `useState` naast TanStack Form.
- Geen API-call in `onSubmit` zelf; roep de mutatie uit `mutations.ts` aan ([tanstack-query.md](tanstack-query.md#mutaties)).

## Open voor BOO-130

- **Meldingen.** De `message` van een issue is de Engelse standaardtekst van Effect, zoals "Expected a value with a length of at least 1". Volgens ADR 0015 kiest web de woorden. `Schema.toStandardSchemaV1` heeft daarvoor de opties `leafHook` en `checkHook`. Hoe die aan `messages.ts` gekoppeld worden, wordt daar beslist.
- **Spaties.** `TodoTitle` weigert een spatie vooraan of achteraan. Of het formulier invoer eerst trimt of de gebruiker de melding laat zien, is een keuze per veld.

## Meer

In de geïnstalleerde packages (vanuit `apps/web`):

- `node_modules/@tanstack/react-form/src/useForm.tsx` en `useField.tsx`: `useForm` en `form.Field`.
- `node_modules/.bun/@tanstack+form-core@1.33.5/node_modules/@tanstack/form-core/src/standardSchemaValidator.ts` (vanuit de repo-root): hoe issues per pad aan velden worden toegekend.
- Dezelfde map, `FormApi.ts`: `validators`, `onSubmit` en `parseValuesWithSchema` (geeft alleen issues terug, geen geparste waarde).

In `repos/effect`:

- `packages/effect/src/Schema.ts`: `toStandardSchemaV1` (met `leafHook` en `checkHook`) en `decodeSync`.
