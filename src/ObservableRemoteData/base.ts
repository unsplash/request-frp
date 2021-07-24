import * as RemoteData from "@devexperts/remote-data-ts";
import { MonadObservable2 } from "fp-ts-rxjs/MonadObservable";
import * as R from "fp-ts-rxjs/Observable";
import { Alt2 } from "fp-ts/Alt";
import { Applicative2 } from "fp-ts/Applicative";
import { Apply2 } from "fp-ts/Apply";
import { Bifunctor2 } from "fp-ts/Bifunctor";
import { flow, identity, pipe } from "fp-ts/function";
import { Functor2 } from "fp-ts/Functor";
import { IO } from "fp-ts/IO";
import { Monad2 } from "fp-ts/Monad";
import { MonadIO2 } from "fp-ts/MonadIO";
import { MonadTask2 } from "fp-ts/MonadTask";
import { MonadThrow2 } from "fp-ts/MonadThrow";
import * as O from "fp-ts/Option";
import { Task } from "fp-ts/Task";
import { Observable } from "rxjs";

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

export interface ObservableRemoteData<E, A>
    extends Observable<RemoteData.RemoteData<E, A>> {}

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

export const fromObservable: <A = never>(
    ma: Observable<A>
) => ObservableRemoteData<never, A> = R.map(RemoteData.success);

export const fromRemoteData: <E, A>(
    fa: RemoteData.RemoteData<E, A>
) => ObservableRemoteData<E, A> = R.of;

export const initial: ObservableRemoteData<never, never> = pipe(
    RemoteData.initial,
    R.of
);
export const pending: ObservableRemoteData<never, never> = pipe(
    RemoteData.pending,
    R.of
);

export const failure: <E>(e: E) => ObservableRemoteData<E, never> = flow(
    RemoteData.failure,
    R.of
);
export const progress = flow(RemoteData.progress, R.of);
export const success: <A>(a: A) => ObservableRemoteData<never, A> = flow(
    RemoteData.success,
    R.of
);

export function fromTask<A>(ma: Task<A>): ObservableRemoteData<never, A> {
    return fromObservable(R.fromTask(ma));
}

export function fromIO<A>(ma: IO<A>): ObservableRemoteData<never, A> {
    return fromObservable(R.fromIO(ma));
}

// -------------------------------------------------------------------------------------
// type class members
// -------------------------------------------------------------------------------------

/**
 * `map` can be used to turn functions `(a: A) => B` into functions `(fa: F<A>) => F<B>` whose argument and return types
 * use the type constructor `F` to represent some computational context.
 *
 * @category Functor
 * @since 0.6.8
 */
export const map: <A, B>(
    f: (a: A) => B
) => <E>(fa: ObservableRemoteData<E, A>) => ObservableRemoteData<E, B> = (f) =>
    R.map(RemoteData.map(f));

/**
 * Apply a function to an argument under a type constructor.
 *
 * @category Apply
 * @since 0.6.0
 */
export const ap = <E, A>(
    fa: ObservableRemoteData<E, A>
): (<B>(
    fab: ObservableRemoteData<E, (a: A) => B>
) => ObservableRemoteData<E, B>) =>
    flow(
        R.map(
            (gab) => (ga: RemoteData.RemoteData<E, A>) => RemoteData.ap(ga)(gab)
        ),
        R.ap(fa)
    );

/**
 * Combine two effectful actions, keeping only the result of the first.
 *
 * Derivable from `Apply`.
 *
 * @category combinators
 * @since 0.6.8
 */
export const apFirst: <E, B>(
    fb: ObservableRemoteData<E, B>
) => <A>(fa: ObservableRemoteData<E, A>) => ObservableRemoteData<E, A> = (fb) =>
    flow(
        map((a) => () => a),
        ap(fb)
    );

/**
 * Combine two effectful actions, keeping only the result of the second.
 *
 * Derivable from `Apply`.
 *
 * @category combinators
 * @since 0.6.8
 */
export const apSecond = <E, B>(
    fb: ObservableRemoteData<E, B>
): (<A>(fa: ObservableRemoteData<E, A>) => ObservableRemoteData<E, B>) =>
    flow(
        map(() => (b: B) => b),
        ap(fb)
    );

/**
 * Identifies an associative operation on a type constructor. It is similar to `Semigroup`, except that it applies to
 * types of kind `* -> *`.
 *
 * @category Alt
 * @since 0.6.8
 */
export const alt = <E, A>(
    that: () => ObservableRemoteData<E, A>
): ((fa: ObservableRemoteData<E, A>) => ObservableRemoteData<E, A>) =>
    R.chain(
        RemoteData.fold(
            () => initial,
            O.fold(() => pending, progress),
            that,
            success
        )
    );

/**
 * @category Bifunctor
 * @since 0.6.8
 */
export const bimap: <E, G, A, B>(
    f: (e: E) => G,
    g: (a: A) => B
) => (fa: ObservableRemoteData<E, A>) => ObservableRemoteData<G, B> =
    /*#__PURE__*/
    flow(RemoteData.bimap, R.map);

/**
 * @category Bifunctor
 * @since 0.6.8
 */
export const mapLeft: <E, G>(
    f: (e: E) => G
) => <A>(fa: ObservableRemoteData<E, A>) => ObservableRemoteData<G, A> = (f) =>
    R.map(RemoteData.mapLeft(f));

/**
 * @category Monad
 * @since 0.6.8
 */
export const chain = <E, A, B>(
    f: (a: A) => ObservableRemoteData<E, B>
): ((ma: ObservableRemoteData<E, A>) => ObservableRemoteData<E, B>) =>
    R.chain(
        RemoteData.fold(
            () => initial,
            O.fold(() => pending, progress),
            failure,
            f
        )
    );

/**
 * Derivable from `Monad`.
 *
 * @category combinators
 * @since 0.6.0
 */
export const flatten: <E, A>(
    mma: ObservableRemoteData<E, ObservableRemoteData<E, A>>
) => ObservableRemoteData<E, A> =
    /*#__PURE__*/
    chain(identity);

/**
 * Composes computations in sequence, using the return value of one computation to determine the next computation and
 * keeping only the result of the first.
 *
 * Derivable from `Monad`.
 *
 * @category combinators
 * @since 0.6.8
 */
export const chainFirst: <E, A, B>(
    f: (a: A) => ObservableRemoteData<E, B>
) => (ma: ObservableRemoteData<E, A>) => ObservableRemoteData<E, A> = (f) =>
    chain((a) =>
        pipe(
            f(a),
            map(() => a)
        )
    );

export const of: Applicative2<URI>["of"] = success;

export const throwError: MonadThrow2<URI>["throwError"] = failure;

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

const map_: Functor2<URI>["map"] = (fa, f) => pipe(fa, map(f));
const ap_: Apply2<URI>["ap"] = (fab, fa) => pipe(fab, ap(fa));
const chain_: Monad2<URI>["chain"] = (ma, f) => pipe(ma, chain(f));
/* istanbul ignore next */
const bimap_: Bifunctor2<URI>["bimap"] = (fea, f, g) => pipe(fea, bimap(f, g));
/* istanbul ignore next */
const mapLeft_: Bifunctor2<URI>["mapLeft"] = (fea, f) => pipe(fea, mapLeft(f));
/* istanbul ignore next */
const alt_: Alt2<URI>["alt"] = (fx, fy) => pipe(fx, alt(fy));

export const URI = "ObservableRemoteData";

export type URI = typeof URI;

declare module "fp-ts/HKT" {
    interface URItoKind2<E, A> {
        ObservableRemoteData: ObservableRemoteData<E, A>;
    }
}

/**
 * @category instances
 * @since 0.6.12
 */
export const Functor: Functor2<URI> = {
    URI,
    map: map_,
};

/**
 * @category instances
 * @since 0.6.12
 */
export const Apply: Apply2<URI> = {
    URI,
    map: map_,
    ap: ap_,
};

/**
 * @category instances
 * @since 0.6.12
 */
export const Applicative: Applicative2<URI> = {
    URI,
    map: map_,
    ap: ap_,
    of,
};

/**
 * @category instances
 * @since 0.6.12
 */
export const Monad: Monad2<URI> = {
    URI,
    map: map_,
    ap: ap_,
    of,
    chain: chain_,
};

/**
 * @category instances
 * @since 0.6.12
 */
export const Bifunctor: Bifunctor2<URI> = {
    URI,
    bimap: bimap_,
    mapLeft: mapLeft_,
};

/**
 * @category instances
 * @since 0.6.12
 */
export const Alt: Alt2<URI> = {
    URI,
    map: map_,
    alt: alt_,
};

/**
 * @category instances
 * @since 0.6.12
 */
export const MonadIO: MonadIO2<URI> = {
    URI,
    map: map_,
    ap: ap_,
    of,
    chain: chain_,
    fromIO,
};

/**
 * @category instances
 * @since 0.6.12
 */
export const MonadTask: MonadTask2<URI> = {
    URI,
    map: map_,
    ap: ap_,
    of,
    chain: chain_,
    fromIO,
    fromTask,
};

/**
 * @category instances
 * @since 0.6.12
 */
export const MonadObservable: MonadObservable2<URI> = {
    URI,
    map: map_,
    ap: ap_,
    of,
    chain: chain_,
    fromIO,
    fromTask,
    fromObservable,
};

/**
 * @category instances
 * @since 0.6.12
 */
export const MonadThrow: MonadThrow2<URI> = {
    URI,
    map: map_,
    ap: ap_,
    of,
    chain: chain_,
    throwError,
};

export const observableRemoteData: Monad2<URI> &
    Bifunctor2<URI> &
    Alt2<URI> &
    MonadObservable2<URI> = {
    URI,
    map: map_,
    of,
    ap: ap_,
    chain: chain_,
    bimap: bimap_,
    mapLeft: mapLeft_,
    alt: alt_,
    fromObservable,
    fromTask,
    fromIO,
};
