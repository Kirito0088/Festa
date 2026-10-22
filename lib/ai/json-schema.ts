import { z } from "zod";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

/**
 * Keywords that Groq's strict structured-output mode does not need. Zod still
 * enforces the real constraints after parsing, so dropping them here only
 * loosens what the model is steered towards, never what we accept.
 */
const DROPPED_KEYWORDS = new Set([
  "$schema",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "minLength",
  "maxLength",
  "pattern",
  "format",
  "minItems",
  "maxItems",
  "default",
  "examples",
]);

function isObject(value: Json): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strictify(node: Json): Json {
  if (Array.isArray(node)) return node.map(strictify);
  if (!isObject(node)) return node;

  const out: JsonObject = {};
  for (const [key, value] of Object.entries(node)) {
    if (DROPPED_KEYWORDS.has(key)) continue;
    out[key] = strictify(value);
  }

  // `anyOf: [{ type: "x" }, { type: "null" }]` → `type: ["x", "null"]`
  const anyOf = out.anyOf;
  if (Array.isArray(anyOf) && anyOf.length === 2) {
    const nullIndex = anyOf.findIndex((s) => isObject(s) && s.type === "null");
    const other = anyOf[1 - nullIndex];
    if (
      nullIndex !== -1 &&
      isObject(other) &&
      typeof other.type === "string" &&
      other.type !== "object" &&
      other.type !== "array"
    ) {
      delete out.anyOf;
      Object.assign(out, other, { type: [other.type, "null"] });
      if (Array.isArray(other.enum)) out.enum = [...other.enum, null];
    }
  }

  if (out.type === "object" && isObject(out.properties ?? null)) {
    out.additionalProperties = false;
    out.required = Object.keys(out.properties as JsonObject);
  }
  return out;
}

/**
 * Converts a Zod schema into the JSON Schema dialect required by Groq's
 * `response_format: { type: "json_schema", strict: true }`: every property
 * required, no additional properties, optional values expressed as nullable.
 */
export function toStrictJsonSchema(schema: z.ZodType): JsonObject {
  const json = z.toJSONSchema(schema, { io: "output", unrepresentable: "any" });
  return strictify(json as Json) as JsonObject;
}
