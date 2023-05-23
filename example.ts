import { open } from "./mod.ts";

// First we should initialize the Ota object. Ota forces a strong
// definition of your KV schema which allows for type checking!
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

// Ota has strong typings for tables, meaning you'll never accidentally
// put invalid data into your KV store again!
await ota.servers.set("demo", {
  name: "Demo Server",
  user_count: 0,
  // description: "This is a demo server", // ERROR!
});

// Ota makes atomic operations as simple as possible. Use the same
// operations you are used to but now they're magically atomic!
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
