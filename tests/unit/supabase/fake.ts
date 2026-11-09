import type { SupabaseClient } from "@supabase/supabase-js";

type Call = [method: string, ...args: unknown[]];

/**
 * Supabase falso: cada consulta encadeada (from().select().eq()...) registra as chamadas
 * e, ao ser aguardada, resolve com `result`.
 */
export function fakeSupabase(result: unknown = { data: null, error: null }) {
  const calls: Call[] = [];
  const builder: Record<string, unknown> = {
    then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  for (const method of ["select", "eq", "order", "range", "upsert", "delete", "insert", "update"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, ...args]);
      return builder;
    };
  }
  const client = {
    from: (table: string) => {
      calls.push(["from", table]);
      return builder;
    },
  } as unknown as SupabaseClient;
  return { client, calls, called: (method: string) => calls.filter(([m]) => m === method).map(([, ...a]) => a) };
}
