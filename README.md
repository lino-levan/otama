# Otama

> Otama is short for Otamajakushi which means tadpole.

Otama is an abstraction built for Deno KV which still exposes a simple KV API
but with a lot of syntactic sugar to make development easier!

## Usage

First we should initialize the Ota object. Ota forces a strong definition of
your KV schema which allows for type checking!

```ts
// example.ts
import { open } from "https://deno.land/x/otama/mod.ts";

const ota = await open(
  {
    tables: {
      servers: {
        name: "nullable string",
        user_count: "number",
      },
      users: {
        name: "string",
        email: "string",
      },
    },
  } as const,
);
```

Ota has strong typings for tables, meaning you'll never accidentally put invalid
data into your KV store again!

```ts
await ota.servers.set("demo", {
  name: "Demo Server",
  user_count: 0,
  // description: "This is a demo server", // This would error during type checking!
});
```

Ota makes atomic operations as simple as possible. Use the same operations you
are used to but now they're magically atomic!

```ts
await ota.atomic(async () => {
  await ota.users.set("new_user", {
    name: "New User",
    email: "example@example.com",
  });

  const server = await ota.servers.get("demo");
  await ota.servers.update("demo", {
    user_count: server.user_count + 1,
  });
});
```

Run the example using the following command

```bash
$ deno run --unstable https://deno.land/x/otama/example.ts
```
