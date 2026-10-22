/**
 * Minimal Groq chat-completions client for structured (JSON-schema) output.
 * Runs server-side only (inside Convex actions); the API key never reaches
 * the browser. Handles timeouts, rate limits, retries and model fallback.
 */

export const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"] as const;

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * A rough token count for rate limiting: about four characters per prompt
 * token, plus half the completion cap, since replies rarely use all of it.
 * Groq's own 429 still backstops any underestimate.
 */
export function estimateTokens(messages: readonly ChatMessage[], maxCompletionTokens: number): number {
  const characters = messages.reduce((sum, message) => sum + message.content.length, 0);
  return Math.ceil(characters / 4) + Math.ceil(maxCompletionTokens / 2);
}

export type GroqFailureKind =
  "missing_key" | "unauthorized" | "rate_limited" | "timeout" | "network" | "http" | "invalid_output";

export type GroqFailure = {
  kind: GroqFailureKind;
  message: string;
  status?: number;
  retryAfterMs?: number;
};

export type GroqResult<T> =
  | { ok: true; data: T; model: string; attempts: number }
  | { ok: false; failure: GroqFailure; attempts: number };

export type StructuredRequest<T> = {
  apiKey: string | undefined;
  models: readonly string[];
  messages: ChatMessage[];
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  /** Validates model text and returns typed data; throws when invalid. */
  parse: (text: string) => T;
  maxCompletionTokens: number;
  temperature?: number;
  timeoutMs?: number;
  attemptsPerModel?: number;
  /** Longest rate-limit wait we accept before trying the next model. */
  maxRetryWaitMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(header);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

function extractContent(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const message = (choices[0] as { message?: { content?: unknown } }).message;
  return typeof message?.content === "string" && message.content.trim() ? message.content : null;
}

export async function requestStructured<T>(req: StructuredRequest<T>): Promise<GroqResult<T>> {
  const fetchImpl = req.fetchImpl ?? fetch;
  const sleep = req.sleep ?? defaultSleep;
  const attemptsPerModel = req.attemptsPerModel ?? 2;
  const timeoutMs = req.timeoutMs ?? 45_000;
  const maxRetryWaitMs = req.maxRetryWaitMs ?? 6_000;

  if (!req.apiKey) {
    return {
      ok: false,
      attempts: 0,
      failure: { kind: "missing_key", message: "GROQ_API_KEY is not configured" },
    };
  }

  let attempts = 0;
  let lastFailure: GroqFailure = { kind: "network", message: "No request was made" };

  for (const model of req.models) {
    for (let attempt = 1; attempt <= attemptsPerModel; attempt++) {
      attempts += 1;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await fetchImpl(GROQ_ENDPOINT, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${req.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: req.messages,
            temperature: req.temperature ?? 0.6,
            max_completion_tokens: req.maxCompletionTokens,
            response_format: {
              type: "json_schema",
              json_schema: { name: req.schemaName, strict: true, schema: req.jsonSchema },
            },
            ...(model.startsWith("openai/gpt-oss")
              ? { reasoning_effort: "low", include_reasoning: false }
              : {}),
          }),
        });
      } catch (error) {
        clearTimeout(timer);
        const aborted = error instanceof Error && error.name === "AbortError";
        lastFailure = aborted
          ? { kind: "timeout", message: `Groq did not respond within ${timeoutMs / 1000}s` }
          : { kind: "network", message: "Could not reach Groq" };
        if (attempt < attemptsPerModel) await sleep(400 * 2 ** attempt);
        continue;
      }
      clearTimeout(timer);

      if (response.status === 401 || response.status === 403) {
        return {
          ok: false,
          attempts,
          failure: { kind: "unauthorized", status: response.status, message: "Groq rejected the API key" },
        };
      }

      if (response.status === 429) {
        const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
        lastFailure = {
          kind: "rate_limited",
          status: 429,
          retryAfterMs,
          message: "Groq's free-tier rate limit was reached",
        };
        const wait = retryAfterMs ?? 2_000;
        if (attempt < attemptsPerModel && wait <= maxRetryWaitMs) {
          await sleep(wait);
          continue;
        }
        break; // each model has its own limits, so try the next one
      }

      if (response.status >= 500) {
        lastFailure = { kind: "http", status: response.status, message: `Groq returned ${response.status}` };
        if (attempt < attemptsPerModel) await sleep(400 * 2 ** attempt);
        continue;
      }

      if (!response.ok) {
        // 400/404/413/422: usually an unsupported model or schema. Try the next model.
        lastFailure = { kind: "http", status: response.status, message: `Groq returned ${response.status}` };
        break;
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        lastFailure = { kind: "invalid_output", message: "Groq returned a non-JSON response" };
        continue;
      }
      const content = extractContent(payload);
      if (!content) {
        lastFailure = { kind: "invalid_output", message: "Groq returned an empty message" };
        continue;
      }
      try {
        return { ok: true, data: req.parse(content), model, attempts };
      } catch (error) {
        lastFailure = {
          kind: "invalid_output",
          message: error instanceof Error ? error.message : "Model output failed validation",
        };
      }
    }
  }

  return { ok: false, attempts, failure: lastFailure };
}

/** A short, user-facing explanation of why AI was not used. */
export function describeFailure(failure: GroqFailure): string {
  switch (failure.kind) {
    case "missing_key":
      return "AI planning is not configured on this deployment, so Festa used its built-in planner.";
    case "unauthorized":
      return "The AI provider rejected this deployment's credentials, so Festa used its built-in planner.";
    case "rate_limited":
      return "The free AI quota is busy right now, so Festa used its built-in planner. You can try again in a minute.";
    case "timeout":
    case "network":
    case "http":
      return "The AI service did not respond in time, so Festa used its built-in planner.";
    case "invalid_output":
      return "The AI response did not pass validation, so Festa used its built-in planner.";
  }
}
