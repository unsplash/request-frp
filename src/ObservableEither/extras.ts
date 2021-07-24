import {
    chainW,
    fromEither,
    fromTaskEither,
    mapLeft,
    tryCatch,
} from "fp-ts-rxjs/ObservableEither";
import * as E from "fp-ts/Either";
import { flow } from "fp-ts/function";
import * as t from "io-ts";
import { fromFetch as observableFromFetch } from "rxjs/fetch";
import * as Response from "../Response";

export * from "fp-ts-rxjs/ObservableEither";

export type FetchError = { message: string };

/**
 * If there's a network error (e.g. the user is offline), the `Observable` emits
 * `Left<FetchError>`.
 *
 * Otherwise, the `Observable` emits `Right<Response>`.
 *
 * When the `Observable` subscription is unsubscribed, if the request is still
 * pending it will be aborted.
 */
export const fromFetch = flow(
    observableFromFetch,
    tryCatch,
    mapLeft(
        flow(
            (error) =>
                error instanceof Error ? error.message : "Unknown error.",
            (message): FetchError => ({ message })
        )
    )
);

export type FromFetchWithJsonResponseError =
    | { tag: "FetchError"; value: FetchError }
    | { tag: "JsonError"; value: Response.GetJsonError };

/**
 * If there's an error, the `Observable` emits `Left` of:
 * - if there's a network error (e.g. the user is offline): `FetchError`
 * - if there's an error reading the response body as JSON: `JsonError`
 *
 * Otherwise, the `Observable` emits `Right<Response>`.
 *
 * When the `Observable` subscription is unsubscribed, if the request is still
 * pending it will be aborted.
 */
export const fromFetchWithJsonResponse = flow(
    fromFetch,
    mapLeft(
        (error): FromFetchWithJsonResponseError => ({
            tag: "FetchError",
            value: error,
        })
    ),
    chainW(
        flow(
            Response.getJson,
            fromTaskEither,
            mapLeft(
                (error): FromFetchWithJsonResponseError => ({
                    tag: "JsonError",
                    value: error,
                })
            )
        )
    )
);

export type FromFetchWithJsonResponseDecodedError =
    | FromFetchWithJsonResponseError
    | { tag: "DecodeError"; value: t.Errors };

/**
 * If there's an error, the `Observable` emits `Left` of:
 * - if there's a network error (e.g. the user is offline): `FetchError`
 * - if there's an error reading the response body as JSON: `JsonError`
 * - if there's a decode error: `DecodeError`
 *
 * Otherwise, the `Observable` emits `Right<Response>`.
 *
 * When the `Observable` subscription is unsubscribed, if the request is still
 * pending it will be aborted.
 */
export const fromFetchWithJsonResponseDecoded = <C extends t.Mixed>(codec: C) =>
    flow(
        fromFetchWithJsonResponse,
        // This is only needed so TypeScript preserves the name of the error
        // union type—otherwise the type would be inlined.
        mapLeft((error): FromFetchWithJsonResponseDecodedError => error),
        chainW(
            flow(
                // Without this annotation, the right value has type `any`
                // because of `t.Mixed`.
                (json): t.Validation<t.TypeOf<C>> => codec.decode(json),
                E.mapLeft(
                    (error): FromFetchWithJsonResponseDecodedError => ({
                        tag: "DecodeError",
                        value: error,
                    })
                ),
                fromEither
            )
        )
    );
