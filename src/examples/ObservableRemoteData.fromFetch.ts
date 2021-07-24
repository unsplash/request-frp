import * as ObservableRemoteData from "../ObservableRemoteData";

const url = "https://httpbin.org/get";

const a = ObservableRemoteData.fromFetch(url);

a.subscribe((v) => console.log("ObservableRemoteData.fromFetch", v));
// Pending
// Success<Response>
