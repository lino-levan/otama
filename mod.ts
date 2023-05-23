import type { ExtractType, OpenOptions, Table } from "./types.ts";

/**
 * Example usage:
 *
 * ```ts
 * const ota = await open(
 *  {
 *    tables: {
 *      servers: {
 *        name: "nullable string",
 *        user_count: "number",
 *       },
 *       users: {
 *         name: "string",
 *         email: "string",
 *       },
 *     },
 *   } as const,
 * );
 *
 * await ota.servers.set("servers", {
 *  name: "test",
 *  user_count: 0,
 * })
 * ```
 */
export async function open<Tables extends Record<string, Table>>(
  options: OpenOptions<Tables>,
) {
  const kv = await Deno.openKv();

  let atomic_op: Deno.AtomicOperation | null = null;

  return {
    atomic: async (cb: () => void | Promise<void>) => {
      if (atomic_op) {
        throw `Kaeru: Nested atomic operations are not allowed`;
      }

      do {
        atomic_op = kv.atomic();
        await cb();
      } while ((await atomic_op.commit()).ok === false);

      atomic_op = null;
    },
    kv,
    ...Object.keys(options.tables).map((table) => {
      return {
        [table]: {
          get: async (key: string) => {
            const res = await kv.get([table, key]);

            if (!res.value) {
              throw `Kaeru: No such key "${key}" in table "${table}" to get`;
            }

            if (atomic_op) {
              atomic_op = atomic_op.check(res);
            }

            return res.value;
          },
          list: async () => {
            const iter = await kv.list({ prefix: [table] });
            const results: Deno.KvEntry<unknown>[] = [];

            for await (const res of iter) results.push(res);

            if (atomic_op) {
              atomic_op = atomic_op.check(...results);
            }

            return results.map((res) => res.value);
          },
          set: async (key: string, value: unknown) => {
            if (atomic_op) {
              atomic_op = atomic_op.set([table, key], value);
            } else {
              await kv.set([table, key], value);
            }
          },
          update: async (key: string, value: Record<string, unknown>) => {
            const res = await kv.get([table, key]);
            if (!res.value) {
              throw `Kaeru: No such key "${key}" in table "${table}" to update`;
            }

            if (atomic_op) {
              atomic_op = atomic_op.check(res).set([table, key], {
                ...res.value,
                ...value,
              });
            } else {
              let op;
              do {
                op = kv.atomic().check(res).set([table, key], {
                  ...res.value,
                  ...value,
                });
              } while ((await op.commit()).ok === false);
            }
          },
          delete: async (key: string) => {
            if (atomic_op) {
              atomic_op = atomic_op.delete([table, key]);
            } else {
              await kv.delete([table, key]);
            }
          },
        },
      };
    }).reduce((a, b) => ({ ...a, ...b }), {}),
  } as unknown as
    & {
      atomic: (callback: () => void | Promise<void>) => Promise<void>;
      kv: Deno.Kv;
    }
    & {
      [P in keyof Tables]: {
        get: (key: string) => Promise<ExtractType<Tables[P]>>;
        list: () => Promise<ExtractType<Tables[P]>[]>;
        set: (key: string, value: ExtractType<Tables[P]>) => Promise<void>;
        update: (
          key: string,
          value: Partial<ExtractType<Tables[P]>>,
        ) => Promise<void>;
        delete: (key: string) => Promise<void>;
      };
    };
}
