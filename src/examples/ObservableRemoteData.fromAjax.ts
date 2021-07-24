import * as ObservableRemoteData from "../ObservableRemoteData";

const url = "https://httpbin.org/post";

const formData = new FormData();
formData.append("foo", "bar");

const a = ObservableRemoteData.fromAjax({
    method: "POST",
    url,
    body: formData,
});

a.subscribe((v) => console.log("ObservableRemoteData.fromAjax", v));
// Pending (with no progress)
// Pending (with progress e.g. 25%)
// Pending (with progress e.g. 50%)
// Pending (with progress e.g. 75%)
// Success<AjaxResponse>
