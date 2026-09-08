/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adversarialTests from "../adversarialTests.js";
import type * as biasAudit from "../biasAudit.js";
import type * as credits from "../credits.js";
import type * as evalRunner from "../evalRunner.js";
import type * as evaluation from "../evaluation.js";
import type * as linkedin from "../linkedin.js";
import type * as linkup from "../linkup.js";
import type * as matchScoring from "../matchScoring.js";
import type * as nebius from "../nebius.js";
import type * as requests from "../requests.js";
import type * as requestsActions from "../requestsActions.js";
import type * as seedEvalCases from "../seedEvalCases.js";
import type * as seedVolunteers from "../seedVolunteers.js";
import type * as volunteers from "../volunteers.js";
import type * as volunteersActions from "../volunteersActions.js";
import type * as volunteersMutations from "../volunteersMutations.js";
import type * as volunteersQueries from "../volunteersQueries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adversarialTests: typeof adversarialTests;
  biasAudit: typeof biasAudit;
  credits: typeof credits;
  evalRunner: typeof evalRunner;
  evaluation: typeof evaluation;
  linkedin: typeof linkedin;
  linkup: typeof linkup;
  matchScoring: typeof matchScoring;
  nebius: typeof nebius;
  requests: typeof requests;
  requestsActions: typeof requestsActions;
  seedEvalCases: typeof seedEvalCases;
  seedVolunteers: typeof seedVolunteers;
  volunteers: typeof volunteers;
  volunteersActions: typeof volunteersActions;
  volunteersMutations: typeof volunteersMutations;
  volunteersQueries: typeof volunteersQueries;
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

export declare const components: {};
