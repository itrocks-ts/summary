[![npm version](https://img.shields.io/npm/v/@itrocks/summary?logo=npm)](https://www.npmjs.org/package/@itrocks/summary)
[![npm downloads](https://img.shields.io/npm/dm/@itrocks/summary)](https://www.npmjs.org/package/@itrocks/summary)
[![GitHub](https://img.shields.io/github/last-commit/itrocks-ts/summary?color=2dba4e&label=commit&logo=github)](https://github.com/itrocks-ts/summary)
[![issues](https://img.shields.io/github/issues/itrocks-ts/summary)](https://github.com/itrocks-ts/summary/issues)
[![discord](https://img.shields.io/discord/1314141024020467782?color=7289da&label=discord&logo=discord&logoColor=white)](https://25.re/ditr)

# summary

Generic action-based object summary in JSON.

*This documentation was written by an artificial intelligence and may contain errors or approximations.
It has not yet been fully reviewed by a human. If anything seems unclear or incomplete,
please feel free to contact the author of this package.*

## Installation

```bash
npm i @itrocks/summary
```

`@itrocks/summary` is designed to be used together with the other it.rocks
backend packages such as `@itrocks/action`, `@itrocks/action-request`,
`@itrocks/route`, and `@itrocks/storage`. Those are installed automatically
through `peerDependencies` of higher‑level packs, or you can depend on them
directly in your own project.

## Usage

`@itrocks/summary` exposes a single action class, `Summary<T>`, which builds a
compact JSON representation for all objects of a given type:

- each record is a tuple `[id, label]`,
- `id` is the persistent identifier (`Identifier`) of the object,
- `label` is a short, human‑readable text obtained via
  [[https://github.com/itrocks-ts/classs-view#representativeValueOf|representativeValueOf]].

By default the action is routed on `/summary` and requires access to a
`Store` (configured by the `@Need('Store')` decorator).

### Minimal example

```ts
// src/domain/user.ts
export class User {
	id   = 0
	name = ''
}

// src/actions/user/summary-users.ts
import { Summary }       from '@itrocks/summary'
import { Route }         from '@itrocks/route'
import type { Request }  from '@itrocks/action-request'

import { User }          from '../../domain/user.js'

@Route('/summary/users')
export class SummaryUsers extends Summary<User> {}

// somewhere in your HTTP framework adapter
const summaryUsers = new SummaryUsers()

export async function summaryUsersJson (request: Request<User>) {
	// Returns a JsonResponse wrapping: Array<[Identifier, string]>
	return summaryUsers.json(request)
}
```

When called with a `Request<User>`, this action loads all `User` objects from
the configured data source, orders them using `@itrocks/storage`'s default
`Sort`, and returns a JSON response like:

```json
[
  [1, "Alice"],
  [2, "Bob"],
  [3, "Charlie"]
]
```

### Complete example: using summaries for a select/drop‑down

This example shows how you might use `@itrocks/summary` to populate a
drop‑down list of related entities in a front‑end.

```ts
// src/domain/project.ts
export class Project {
	id    = 0
	name  = ''
	owner = 0  // references a User.id
}

// src/domain/user.ts
export class User {
	id   = 0
	name = ''
}

// src/actions/user/summary-users.ts
import { Summary }       from '@itrocks/summary'
import { Route }         from '@itrocks/route'
import type { Request }  from '@itrocks/action-request'

import { User }          from '../../domain/user.js'

@Route('/summary/users')
export class SummaryUsers extends Summary<User> {}

// HTTP adapter (pseudo‑code)
const summaryUsers = new SummaryUsers()

export async function getUserOptions (request: Request<User>) {
	const response = await summaryUsers.json(request)
	// Assuming JsonResponse exposes the payload as `body`
	const records = response.body as [number, string][]

	return records.map(([id, label]) => ({ value: id, label }))
}

// In a front‑end template (pseudo‑code)
// const options = await fetch('/summary/users').then(r => r.json())
// <select name="owner">
//   {options.map(([id, label]) => (
//     <option value={id}>{label}</option>
//   ))}
// </select>
```

Thanks to `representativeValueOf`, the label automatically follows the
configuration of your class view: it can be as simple as a single property
(`name`), or a richer combination of fields (for example
`"{firstName} {lastName} <{email}>"`).

## API

### Types

```ts
export type SummaryRecord = [Identifier, string]
```

Represents one line of the summary result:

- index `0` – the object's identifier, as defined by `@itrocks/storage`'s
  `Identifier` type;
- index `1` – the human‑readable label for this object.

The JSON payload returned by `Summary#json` is an array of `SummaryRecord`.

### `Summary<T extends object = object>`

```ts
import { Summary } from '@itrocks/summary'

export class Summary<T extends object = object> extends Action<T> {
	json(request: Request<T>): Promise<JsonResponse>
}
```

`Summary` is an `Action<T>` that:

- declares a dependency on a `Store` (`@Need('Store')`),
- is mapped to the `/summary` route by default (`@Route('/summary')`),
- reads all entities of the requested type from the configured data source,
- sorts them using the standard `Sort` strategy from `@itrocks/storage`,
- converts each entity to a **representative value** using
  `representativeValueOf` from `@itrocks/class-view`,
- returns the resulting list as a JSON response of `SummaryRecord[]`.

#### `json(request: Request<T>): Promise<JsonResponse>`

Executes the summary action in JSON mode.

**Parameters**

- `request` – an `@itrocks/action-request` `Request<T>` instance, typically
  created by your HTTP adapter from the incoming HTTP request. The `type`
  carried by the request identifies which entity class to summarize (for
  example `User`, `Project`, …).

**Return value**

- a `Promise` that resolves to a `JsonResponse` (from `@itrocks/core-responses`)
  whose payload is `SummaryRecord[]`.

**Side effects / requirements**

- requires access to a configured `Store` via `@itrocks/storage`'s
  `dataSource()`;
- performs read‑only access; it does not modify stored entities.

## Typical use cases

- **Populating select boxes and drop‑downs** – fetch a list of
  `[id, label]` pairs to feed HTML `<select>`, autocomplete widgets, or other
  UI components that need a compact representation of many objects.
- **Navigation lists and sidebars** – build side menus, breadcrumbs, or
  small navigation lists that display concise labels instead of full entity
  details.
- **Lookup dialogs** – use the summary endpoint to display short lines in a
  search dialog while keeping server responses small.
- **Read‑only references in other views** – when rendering complex objects
  that reference other entities, call the summary endpoint to display
  readable labels (for example, show the project owner name instead of the
  raw `ownerId`).
