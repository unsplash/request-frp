# `request-frp`

(FRP stands for Functional Reactive Programming.)

`request-frp` is a package that provides pure wrappers around [`fetch`] and [`XMLHttpRequest`] so they can be used with types such as:

-   `Observable` from [RxJS]
-   `Task` and `Either` from [`fp-ts`]
-   `RemoteData` from [`remote-data-ts`]

Primarily these wrappers are:

-   `TaskEither.fromFetch` (uses `fetch`)
-   `ObservableEither.fromFetch` (uses `fetch`)
-   `ObservableRemoteData.fromFetch` (uses `fetch`)
-   `ObservableRemoteData.fromAjax` (uses `XMLHttpRequest`)

Unlike functions such as `fetch` and `response.json()`, these functions will never throw exceptions (that also includes things like promise rejections and `Observable` errors). Instead, all errors are returned as objects e.g. `Either.Left` or `RemoteData.Failure`.

These functions are used heavily in production at [Unsplash](https://unsplash.com/).

Additionally, this package provides a few convenience wrappers:

-   `ObservableEither.fromFetchWithJsonResponse`: calling `response.json()` is unsafe because it can reject, so this wrapper provides a pure/safe alternative
-   `ObservableEither.fromFetchWithJsonResponseDecoded`: decodes the response body using a given [`io-ts`] type

You can find examples in the [`./src/examples`](./src/examples) directory.

## `Task` vs `Observable`

Unlike `Task`s, `Observable`s can emit more than once. For example, when used with `RemoteData` this means they can emit `Pending` (i.e. loading) and then they can emit _again_ with `Failure` or `Success`. [Example](./src/examples/ObservableRemoteData.fromFetch.ts).

`Observable`s also have built-in support for cancellation via subscriptions.

If you don't care about loading states (`RemoteData.Pending`) and you're happy using things like `AbortController`, `TaskEither` should suffice.

## `ObservableRemoteData.fromFetch` vs `ObservableRemoteData.fromAjax`

`ObservableRemoteData.fromAjax` includes information about the upload progress (inside `RemoteData.Pending`), whereas `ObservableRemoteData.fromFetch` does not.

## To do

-   [ ] Test usage with `node-fetch`
-   [ ] Remove `io-ts` dependency (?)
-   [ ] Remove `content-type` dependency (?)
-   [ ] Use peer dependencies for fp-ts et al
-   [ ] Publish to npm

[rxjs]: https://github.com/ReactiveX/rxjs
[`fp-ts`]: https://github.com/gcanti/fp-ts
[`fp-ts-rxjs`]: https://github.com/gcanti/fp-ts-rxjs
[`remote-data-ts`]: https://github.com/devexperts/remote-data-ts
[`io-ts`]: https://github.com/gcanti/io-ts
[`fetch`]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
[`xmlhttprequest`]: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
