import * as TaskEither from "../TaskEither";

//
// TaskEither.fromFetch
//

const url = "https://httpbin.org/get";

const abortController = new AbortController();
const a = TaskEither.fromFetch(url, { signal: abortController.signal });

a().then((v) => console.log("TaskEither.fromFetch", v));
// Right<Response>

abortController.abort();
