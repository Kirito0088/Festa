/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as auth from "../auth.js";
import type * as budget from "../budget.js";
import type * as concierge from "../concierge.js";
import type * as demo from "../demo.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_cascade from "../lib/cascade.js";
import type * as lib_input from "../lib/input.js";
import type * as lib_plan from "../lib/plan.js";
import type * as lib_rateLimits from "../lib/rateLimits.js";
import type * as lib_validators from "../lib/validators.js";
import type * as moodboard from "../moodboard.js";
import type * as plans from "../plans.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";
import type * as vendors from "../vendors.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  auth: typeof auth;
  budget: typeof budget;
  concierge: typeof concierge;
  demo: typeof demo;
  events: typeof events;
  http: typeof http;
  "lib/access": typeof lib_access;
  "lib/cascade": typeof lib_cascade;
  "lib/input": typeof lib_input;
  "lib/plan": typeof lib_plan;
  "lib/rateLimits": typeof lib_rateLimits;
  "lib/validators": typeof lib_validators;
  moodboard: typeof moodboard;
  plans: typeof plans;
  tasks: typeof tasks;
  users: typeof users;
  vendors: typeof vendors;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
