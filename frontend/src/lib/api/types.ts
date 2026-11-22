import type { components, paths } from "./schema";

/**
 * Types that come straight from backend/docs/openapi.yaml (regenerate with `npm run gen:api`).
 * Use these instead of hand-writing response shapes, so the frontend can't drift from the API.
 *
 *   type Me = ResponseOf<"/workers/me", "get">;
 *   type RegisterBody = BodyOf<"/auth/register", "post">;
 *   type Role = Schemas["Role"];
 */
export type Schemas = components["schemas"];

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";
type Operation<P extends keyof paths, M extends HttpMethod> = NonNullable<paths[P][M]>;

type JsonContent<T> = T extends { content: { "application/json": infer J } } ? J : never;

/** The JSON body of the successful (200, 201 or 202) response of an operation. */
export type ResponseOf<P extends keyof paths, M extends HttpMethod> =
  Operation<P, M> extends { responses: infer R }
    ? JsonContent<R[Extract<keyof R, 200 | 201 | 202>]>
    : never;

/** The JSON request body of an operation. */
export type BodyOf<P extends keyof paths, M extends HttpMethod> =
  Operation<P, M> extends { requestBody?: infer B } ? JsonContent<NonNullable<B>> : never;

/** The query parameters of an operation. */
export type QueryOf<P extends keyof paths, M extends HttpMethod> =
  Operation<P, M> extends { parameters: { query?: infer Q } } ? NonNullable<Q> : never;
