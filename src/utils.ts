// note: one extra backslash for JavaScript string
const colon_re = "\\s*:\\s*";
// note: two extra backslashes for JavaScript string, one for regex
const value_re = `((?:".*(?!\\\\")")|(?:'.*(?!\\\\')'))`;
// note: one extra backslash for JavaScript string
const comma_re = "\\s*,\\n*\\s*";

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
  return new RegExp(`${key}${colon_re}${value_re}`);
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
    keys.map((key) => `${key}${colon_re}${value_re}`).join(comma_re),
  );
}
