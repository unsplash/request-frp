import { pipe } from "fp-ts/lib/function";
import * as ObservableEither from "../ObservableEither";
import * as ObservableRemoteData from "../ObservableRemoteData";

const url = "https://httpbin.org/get";

const a = pipe(
    ObservableEither.fromFetch(url),
    ObservableRemoteData.fromObservableEither
);

a.subscribe((v) =>
    console.log(
        "ObservableEither.fromFetch + ObservableRemoteData.fromObservableEither",
        v
    )
);
// Pending
// Success<Response>
