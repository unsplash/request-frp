import * as ContentTypeHelpers from "content-type";
import * as E from "fp-ts/Either";
import { flow } from "fp-ts/function";
import * as O from "fp-ts/Option";
import * as TaskEither from "fp-ts/TaskEither";
import { ofType, unionize, UnionOf } from "unionize";

export const GetJsonError = unionize({
    NotJson: {},
    JsonParseError: ofType<{ message: string }>(),
});
export type GetJsonError = UnionOf<typeof GetJsonError>;

const CONTENT_TYPE_RESPONSE_HEADER = "content-type";
const CONTENT_TYPE_JSON = "application/json";

const checkIsJson = flow(
    (response: Response) => response.headers.get(CONTENT_TYPE_RESPONSE_HEADER),
    O.fromNullable,
    O.map(flow(ContentTypeHelpers.parse, (result) => result.type)),
    O.exists((type) => type === CONTENT_TYPE_JSON)
);

export const getJson = (
    response: Response
): TaskEither.TaskEither<GetJsonError, E.Json> =>
    checkIsJson(response)
        ? TaskEither.tryCatch(
              () =>
                  // We cast to avoid leaking `any`.
                  response.json() as Promise<E.Json>,
              (error) =>
                  GetJsonError.JsonParseError({
                      message:
                          error instanceof Error
                              ? error.message
                              : "Unknown error.",
                  })
          )
        : TaskEither.left(GetJsonError.NotJson());
