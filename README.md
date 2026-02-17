[![npm version](https://img.shields.io/npm/v/@itrocks/summary?logo=npm)](https://www.npmjs.org/package/@itrocks/summary)
[![npm downloads](https://img.shields.io/npm/dm/@itrocks/summary)](https://www.npmjs.org/package/@itrocks/summary)
[![GitHub](https://img.shields.io/github/last-commit/itrocks-ts/summary?color=2dba4e&label=commit&logo=github)](https://github.com/itrocks-ts/summary)
[![issues](https://img.shields.io/github/issues/itrocks-ts/summary)](https://github.com/itrocks-ts/summary/issues)
[![discord](https://img.shields.io/discord/1314141024020467782?color=7289da&label=discord&logo=discord&logoColor=white)](https://25.re/ditr)

# summary

Generic action-based objects summary in HTML or JSON.

*This documentation was written by an artificial intelligence and may contain errors or approximations.
It has not yet been fully reviewed by a human. If anything seems unclear or incomplete,
please feel free to contact the author of this package.*

## Installation

```bash
npm i @itrocks/summary
```

`@itrocks/summary` is designed to be used together with the other
it.rocks backend packages such as `@itrocks/action`, `@itrocks/action-request`, `@itrocks/route`,
and `@itrocks/storage`.

## What it returns

A summary is a list of tuples:

```ts
export type SummaryRecord = [Identifier, string]
```

- `Identifier` is the persistent identifier (from [@itrocks/storage](https://github.com/itrocks-ts/storage)).
- The string is the representative value of the object (from [representativeValueOf](https://github.com/itrocks-ts/class-view)).

Example JSON payload:

```json
[
  [1, "Alice"],
  [2, "Bob"],
  [3, "Charlie"]
]
```

Identifier `0` is reserved internally and never represents a persisted entity.

## Usage

`@itrocks/summary` exposes a single action class, `Summary`.

### Minimal example

```ts
@Route('/summary/users')
export class SummaryUsers extends Summary<User> {}

const summaryUsers = new SummaryUsers()

export async function summaryUsersJson(request: Request<User>) {
  return summaryUsers.json(request)
}
```

### HTML output

The action also supports an HTML variant:

```ts
export async function summaryUsersHtml(request: Request<User>) {
  return summaryUsers.html(request)
}
```

The produced HTML is:

```html
<ul>
  <li data-id="1">Alice</li>
  <li data-id="2">Bob</li>
  <li data-id="3">Charlie</li>
</ul>
```

The label content is generated from `representativeValueOf(object)`. If
representative values may contain user-provided content, proper HTML
escaping must be ensured by the surrounding framework.

## Query parameters (filtering and paging)

```ts
export interface SummaryRequest {
  limit?:      number
  offset?:     number
  page?:       number
  startsWith?: string
}
```

### startsWith

Filters results to objects whose representative property begins with the given prefix.

The filtering is delegated to the underlying `search(...)` implementation.
Case sensitivity and collation therefore depend on the configured storage layer.

### limit, offset, page

- `limit` - maximum number of records returned.
- `offset` - zero‑based index of the first record to return.
- `page` - alternative to `offset`, computed as: `offset = page * limit`

Precedence rules:

- If not paging parameter `limit` is provided, `offset` and `page` are ignored,
  no implicit limit is applied, and all matching records are returned.
- If `limit` is provided as an empty string, a default `limit` of 1000 is applied.
- If both `offset` and `page` are provided, only `offset` is used.
- Otherwise, if `page` is provided, `offset = page * limit`.

### Truncation marker

When paging and/or filtering is used and additional matching records
exist beyond the returned slice, a pseudo‑record is appended:

```json
  [0, "..."]
```

This record signals that the result set is incomplete. It is always
appended at the end of the result array.

## API

```ts
export class Summary<T extends object = object> extends Action<T> {
  html(request: Request<T>): Promise<HtmlResponse>
  json(request: Request<T>): Promise<JsonResponse>
}
```

- `json()` returns `SummaryRecord[]`.
- `html()` returns an HTML `<ul>` containing `<li data-id="…">…</li>` entries.

Internally, `Summary`:

- Retrieves entities via `dataSource().search(...)`
- Aplies sorting through the storage layer
- Applies optional paging (`limit`, `offset`, `page`)
- Computes each label via `representativeValueOf(object)`

## Typical use cases

- Select boxes / drop‑downs
- Autocomplete with progressive narrowing
- Lightweight navigation lists
