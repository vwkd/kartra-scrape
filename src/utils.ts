// note: one extra backslash for JavaScript string
const COLON_RE = "\\s*:\\s*";
// note: two extra backslashes for JavaScript string, one for regex
const VALUE_RE = `((?:".*(?!\\\\")")|(?:'.*(?!\\\\')'))`;
// note: one extra backslash for JavaScript string
const COMMA_RE = "\\s*,\\n*\\s*";

/**
 * Create regex that matches first string property
 *
 * - e.g. `foo: "bar"` or `foo: 'bar'`
 * - note: only works if key isn't quoted
 *
 * @param key property name
 * @returns regex
 */
export function stringPropertyRegex(key: string) {
  return new RegExp(`${key}${COLON_RE}${VALUE_RE}`);
}

/**
 * Create regex that matches first string properties
 *
 * - e.g. `{ foo: "bar", baz: "buz" }`
 * - note: the order of the arguments is significant, it must match the order of the properties
 * - note: only works if all properties are strings
 * - note: only works if key isn't quoted
 *
 * @param keys property names
 * @returns regex
 */
export function stringPropertiesRegex(...keys: string[]) {
  return new RegExp(
    keys.map((key) => `${key}${COLON_RE}${VALUE_RE}`).join(COMMA_RE),
  );
}
