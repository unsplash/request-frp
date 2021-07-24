import * as t from "io-ts";
import * as ObservableEither from "../ObservableEither";

//
// ObservableEither.fromFetch
//

const url = "https://httpbin.org/get";

const a = ObservableEither.fromFetch(url);

const subscription = a.subscribe((v) =>
    console.log("ObservableEither.fromFetch", v)
);
// Right<Response>

// Abort the request
subscription.unsubscribe();

//
// ObservableEither.fromFetchWithJsonResponse
//

const b = ObservableEither.fromFetchWithJsonResponse(url);

b.subscribe((v) =>
    console.log("ObservableEither.fromFetchWithJsonResponse", v)
);
// Right<Json>

//
// ObservableEither.fromFetchWithJsonResponseDecoded
//

const MyResponseType = t.type({
    slideshow: t.type({
        author: t.string,
    }),
});
interface MyResponseType extends t.TypeOf<typeof MyResponseType> {}

const c =
    ObservableEither.fromFetchWithJsonResponseDecoded(MyResponseType)(url);

c.subscribe((v) =>
    console.log("ObservableEither.fromFetchWithJsonResponseDecoded", v)
);
// Right<MyResponseType> === Right<{ slideshow: { author: string } }>
