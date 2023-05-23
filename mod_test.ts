import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.188.0/testing/asserts.ts";

import { open } from "./mod.ts";

const otama = await open(
  {
    tables: {
      servers: {
        name: "nullable string",
      },
      users: {
        name: "string",
        email: "string",
      },
    },
  } as const,
);

Deno.test("otama.set()", async () => {
  await otama.servers.set("deno", {
    name: "Deno",
  });

  await otama.servers.set("outdated", {
    name: null,
  });

  await otama.users.set("lino", {
    name: "Lino Le Van",
    email: "👀",
  });
});

Deno.test("otama.get()", async () => {
  assertEquals(await otama.servers.get("deno"), {
    name: "Deno",
  });

  assertEquals(await otama.servers.get("outdated"), {
    name: null,
  });

  assertEquals(await otama.users.get("lino"), {
    name: "Lino Le Van",
    email: "👀",
  });

  assertRejects(async () => {
    await otama.users.get("invalid key");
  });
});

Deno.test("otama.list()", async () => {
  assertEquals(await otama.servers.list(), [
    {
      name: "Deno",
    },
    {
      name: null,
    },
  ]);

  assertEquals(await otama.users.list(), [{
    name: "Lino Le Van",
    email: "👀",
  }]);
});

Deno.test("otama.update()", async () => {
  await otama.servers.update("deno", {
    name: "Deno 2.0!!!",
  });

  assertEquals(await otama.servers.get("deno"), {
    name: "Deno 2.0!!!",
  });

  await otama.users.update("lino", {
    email: "still nothing",
  });

  assertEquals(await otama.users.get("lino"), {
    name: "Lino Le Van",
    email: "still nothing",
  });

  assertRejects(async () => {
    await otama.users.update("invalid key", {
      name: "not real",
    });
  });
});

Deno.test("otama.delete()", async () => {
  await otama.servers.delete("deno");
  assertRejects(async () => {
    await otama.servers.get("deno");
  });

  await otama.servers.delete("outdated");
  assertRejects(async () => {
    await otama.servers.get("outdated");
  });

  await otama.users.delete("lino");
  assertRejects(async () => {
    await otama.users.get("lino");
  });
});

Deno.test("otama.atomic()", async () => {
  await otama.atomic(async () => {
    await otama.servers.set("testing", {
      name: "test",
    });
    await otama.servers.delete("testing");
  });

  assertRejects(async () => {
    await otama.servers.get("testing");
  });
});

Deno.test("otama.kv", async () => {
  const res = await otama.kv.get(["users", "strange"]);

  assertEquals(res.value, null);
});
