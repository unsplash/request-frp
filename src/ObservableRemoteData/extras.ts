import * as RemoteData from "@devexperts/remote-data-ts";
import * as E from "fp-ts/Either";
import { flow, pipe } from "fp-ts/function";
import * as Rx from "rxjs";
import * as RxAjax from "rxjs/ajax";
import * as Observable from "rxjs/operators";
import * as ObservableEither from "../ObservableEither";
import { ObservableRemoteData } from "./base";

export const fromObservableEither: <E, A>(
    ob$: Rx.Observable<E.Either<E, A>>
) => ObservableRemoteData<E, A> = flow(
    Observable.map(RemoteData.fromEither),
    Observable.startWith(RemoteData.pending)
);

/**
 * The `Observable` immediately emits `Pending`.
 *
 * Then, if there's a network error (e.g. the user is offline), the `Observable`
 * emits `Failure<FetchError>`.
 *
 * Otherwise, the `Observable` emits `Success<Response>`.
 *
 * When the `Observable` subscription is unsubscribed, if the request is still
 * pending it will be aborted.
 */
export const fromFetch = flow(ObservableEither.fromFetch, fromObservableEither);

export const tryCatch = <E, A>(
    onError: (e: unknown) => E
): Rx.OperatorFunction<A, RemoteData.RemoteData<E, A>> =>
    flow(
        ObservableEither.tryCatch,
        ObservableEither.mapLeft(onError),
        fromObservableEither
    );

const fromObservableAjaxResponse = <A>(
    ob$: Rx.Observable<RxAjax.AjaxResponse<A>>
): ObservableRemoteData<RxAjax.AjaxError, RxAjax.AjaxResponse<A>> =>
    pipe(
        ob$,
        tryCatch((error): RxAjax.AjaxError => {
            if (error instanceof RxAjax.AjaxError) {
                return error;
            } else {
                // Throw other errors because they might be genuine exceptions
                // e.g. syntax errors.
                throw error;
            }
        }),
        Observable.map(
            RemoteData.chain(
                /**
                 * Note: return type annotation is needed to workaround this
                 * issue: https://github.com/devexperts/remote-data-ts/issues/60
                 */
                (
                    ajaxResponse
                ): RemoteData.RemoteData<
                    RxAjax.AjaxError,
                    RxAjax.AjaxResponse<A>
                > =>
                    ajaxResponse.type === "download_load"
                        ? RemoteData.success(ajaxResponse)
                        : RemoteData.fromProgressEvent(
                              ajaxResponse.originalEvent
                          )
            )
        )
    );

/**
 * The `Observable` immediately emits `Pending`.
 *
 * Then, each time a progress event occurs, the `Observable` emits `Pending`
 * again with the progress details (`RemoteProgress`).
 *
 * Then, if there's a network error (e.g. the user is offline), the `Observable`
 * emits `Failure<FetchError>`.
 *
 * Otherwise, the `Observable` emits `Success<AjaxResponse<unknown>>`.
 *
 * When the `Observable` subscription is unsubscribed, if the request is still
 * pending it will be aborted.
 */
export const fromAjax = (
    request: RxAjax.AjaxConfig
): ObservableRemoteData<RxAjax.AjaxError, RxAjax.AjaxResponse<unknown>> =>
    pipe(
        RxAjax.ajax({
            ...request,
            includeUploadProgress: true,
        }),
        fromObservableAjaxResponse
    );
