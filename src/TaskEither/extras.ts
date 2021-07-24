import { flow } from "fp-ts/function";
import * as TaskEither from "fp-ts/TaskEither";

export type FetchError = { message: string };

/**
 * If there's a network error (e.g. the user is offline), the `Promise` resolves
 * with `Left<FetchError>`.
 *
 * Otherwise, the `Promise` resolves with `Right<Response>`.
 *
 * Can be used with `AbortController`.
 */
export const fromFetch = TaskEither.tryCatchK(
    fetch,
    flow(
        (error) => (error instanceof Error ? error.message : "Unknown error."),
        (message): FetchError => ({ message })
    )
);
