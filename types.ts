// https://stackoverflow.com/questions/70831365/can-i-slice-literal-type-in-typescript
type Split<S extends string, D extends string> = string extends S ? string[]
  : S extends "" ? []
  : S extends `${infer T}${D}${infer U}` ? [T, ...Split<U, D>]
  : [S];

type ValueOf<T> = T[keyof T];

type SimpleExtractStringType<T> = T extends "string" ? string
  : T extends "number" ? number
  : T extends "boolean" ? boolean
  : T extends "foreign_key" ? string
  : never;

type ExtractStringType<T extends string> =
  | SimpleExtractStringType<
    Extract<
      ValueOf<Split<T, " ">>,
      "string" | "number" | "boolean" | "foreign_key"
    >
  >
  | ([Extract<ValueOf<Split<T, " ">>, "nullable">] extends [never] ? never
    : null);

export type ExtractType<T extends Table> = {
  [Key in keyof T]: T[Key] extends string ? ExtractStringType<T[Key]>
    : T[Key] extends Table ? ExtractType<T[Key]>
    : never;
};

export interface Table {
  [key: string]: string | Table;
}

export interface OpenOptions<Tables extends Record<string, Table>> {
  tables: Tables;
}
