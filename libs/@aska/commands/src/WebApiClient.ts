import { RequireAtLeastOne, RequireOnlyOne } from "@aska/utils";
import { Observable, catchError, from, map, of, switchMap } from "rxjs";

export type WE_RequestsStruct<
  Target,
  OPERATORS extends string = string,
  ACTIONS extends Record<OPERATORS, string> = Record<OPERATORS, string>
> = {
  [OPERATOR in OPERATORS]: {
    [ACTION in ACTIONS[OPERATOR]]: Target;
  };
};

export type WE_REQONE<
  Target,
  OPERATORS extends string = string,
  ACTIONS extends Record<OPERATORS, string> = Record<OPERATORS, string>
> = RequireOnlyOne<{
  [OPERATOR in OPERATORS]: RequireOnlyOne<{
    [ACTION in ACTIONS[OPERATOR]]: Target;
  }>;
}>;

/**
 * how requests have to be formed to be sent
 */
export type I_WE_Request_T = {
  /**
   * url part
   *
   * may be specified as list of segments
   */
  url: string | string[];
  /**
   * will be rendered as ?a=b when present
   */
  queryArgs?: Record<string, string>;
  /**
   * additional headers
   */
  headers?: Record<string, string>;
  method?: "GET" | "POST" | "[@todo: type out]";
  /**
   * already stringified/prepared/etc.
   * utils will be available for common packings
   */
  data?: string;
};
/**
 * raw request response information
 */
export type I_WE_Response_T = {
  /**
   * complete requested url
   */
  url: string;
  /**
   * originally computed request object; may change if internal reporesentation changes; but is api-stable with the configuration-types
   */
  _request: I_WE_Request_T;
  /**
   * server-returned headers
   */
  responseHeaders: Record<string, string>;
  /**
   * raw body data, your config-handler must handle unpacking it
   */
  body: string;
  /**
   * http status
   */
  status: number;
  /**
   * http status text
   */
  statusText: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- @todo: review
export type WE_RequestDef<PartOptions, ReturnValue> = {
  /**
   * render your options into request-options
   *
   * @todo: MaybeObservable'ify because are async anyway
   */
  renderReq: (options: PartOptions) => I_WE_Request_T | string;
  /**
   * prepare your result data (eg. json parse/etc.)
   */
  parseRes: (result: I_WE_Response_T, options: PartOptions) => ReturnValue;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- @todo: review
export type WE_RequestsDef = WE_RequestsStruct<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- inferred
  WE_RequestDef<any, any>
>;

export type WE_Setup<Requests extends WE_RequestsDef = WE_RequestsDef> = {
  /**
   * how many depths should be automated into the first path-segment of the url? (dry and prevents typos)
   */
  autoParamDepth?: 0 | 1 | 2;

  /**
   * Requests to implement
   */
  requests: Requests;

  /**
   * api name
   */
  name: string;
  /**
   * base url to put computed parameters onto
   */
  baseUrl: string;
  /**
   * a chance to modify each request after it has been constructed and before it's sent (for purposes like adding auth-data, etc.)
   *
   * if you wish not to change in the current invoke, undefined will fall back to the original request object
   */
  preRequest?: (
    request: Readonly<I_WE_Request_T>
  ) => I_WE_Request_T | undefined;
};

/**
 * infer request type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- inferred
export type UWE_SetRequests<S extends WE_Setup<any>> = S extends WE_Setup<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- @todo: review
  infer R
>
  ? R
  : never;

/**
 * infer params for Request
 */
export type UWE_RqsParams<
  C extends WE_RequestsDef,
  Operation extends string,
  Action extends string
> = C extends {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- inferred
  [op in Operation]: { [ac in Action]: WE_RequestDef<infer Params, any> };
}
  ? Params
  : never;
/**
 * infer result of Request
 */
export type UWE_RqsResult<
  C extends WE_RequestsDef,
  Operation extends string,
  Action extends string
> = C extends {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- inferred
  [op in Operation]: { [ac in Action]: WE_RequestDef<any, infer Result> };
}
  ? Result
  : never;

/**
 * @todo: export with class-adapter
 * interface type to infer the requests that can be made
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- inferred
export type RequestRequest<Setup extends WE_Setup<any>> = RequireAtLeastOne<{
  [Operation in keyof UWE_SetRequests<Setup>]: RequireAtLeastOne<{
    [Action in keyof UWE_SetRequests<Setup>[Operation]]: UWE_RqsParams<
      UWE_SetRequests<Setup>,
      Extract<Operation, string>,
      Extract<Action, string>
    >;
  }>;
}>;

/**
 * @todo: export with class-adapter
 * interface type to infer the requests that can be made
 */
export type RequestResponse<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- inferred
  Setup extends WE_Setup<any>,
  Request extends RequestRequest<Setup>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- inferred
> = Request extends Record<infer Op, Record<infer Ac, any>>
  ? UWE_RqsResult<
      UWE_SetRequests<Setup>,
      Extract<Op, string>,
      Extract<Ac, string>
    >
  : never;
/**
 * auto-self-managed web-api client that translates and even may validate data simmilar to the Request executor
 */
export class WebApiClient<
  Requests extends WE_RequestsDef,
  Setup extends WE_Setup<Requests> = WE_Setup<Requests>
> {
  constructor(protected setup: Setup) {}
  /**
   * useful if init is in prop and config is available in a later method
   */
  _updateBaseUrl(updated: string) {
    const old = this.setup.baseUrl;
    this.setup.baseUrl = updated;
    return old;
  }

  /**
   * issues a request to be executed and parsed
   */
  issue<Request extends RequestRequest<Setup>>(
    request: Request,
    doThrow = false,
    fallback = undefined
  ): Observable<RequestResponse<Setup, Request>> {
    const rqst = this.renderCommand(request);
    const rUrl =
      [
        this.setup.baseUrl,
        ...(typeof rqst.url === "string" ? [rqst.url] : rqst.url),
      ]
        .join("/")
        .replaceAll(/\/{2,}/g, "/") +
      (rqst.queryArgs === undefined
        ? ""
        : "?" +
          Object.entries(rqst.queryArgs)
            .map(([n, v]) => `${n}=${v}`)
            .join(`&`));
    // @todo: execute request
    return from(
      fetch(rUrl, {
        headers: rqst.headers,
        method: rqst.method ?? "GET",
        referrerPolicy: "no-referrer",
        // cache: 'no-cache',
        body: rqst.data,
      })
    ).pipe(
      switchMap((rawResponse) =>
        from(
          rawResponse.bodyUsed
            ? rawResponse.text()
            : (rawResponse.json() as Promise<any>)
        ).pipe(
          catchError(() => of("NO BODY PRESENT")),
          map((bodyText) => {
            // console.log(bodyText, JSON.stringify({ ...rawResponse }));
            return {
              bodyText:
                typeof bodyText === "string"
                  ? bodyText
                  : // just to unify the api... will work with dynamic typings in future versions!
                    JSON.stringify({ ...bodyText }, null, ""),
              rawResponse,
            };
          })
        )
      ),
      map(({ bodyText, rawResponse }) => {
        return this.parseCommandResult(
          {
            body: bodyText,
            _request: rqst,
            responseHeaders: Object.fromEntries([
              // trust me, it works ;D
              ...(rawResponse.headers as any),
            ]),
            status: rawResponse.status,
            statusText: rawResponse.statusText,
            url: rUrl,
          },
          request
        );
      })
    );
  }
  /**
   * renders options into commands using local configs and configured argument-transformers
   */
  private renderCommand<Request extends RequestRequest<Setup>>(
    request: Request
  ): I_WE_Request_T {
    const [operation, action] = this.identifyRequest(request);
    const literals =
      this.setup.autoParamDepth === 0
        ? ""
        : " " +
          operation +
          (this.setup.autoParamDepth === 2 ? " " + action : "");
    let computedArgs = this.setup.requests[operation][action].renderReq(
      request[operation][action]
    );

    // @todo: invert!
    if (typeof computedArgs === "string") {
      computedArgs = {
        url: [computedArgs],
      };
    }
    if (typeof computedArgs.url === "string") {
      computedArgs.url = computedArgs.url.split("/");
    }
    switch (this.setup.autoParamDepth) {
      case 1:
        computedArgs.url.splice(0, 0, operation);
        break;
      case 2:
        computedArgs.url.splice(0, 0, operation, action);
        break;
      default:
        break;
    }
    // @todo: form request object to be given to fetch api to finally execute the rendered web request
    return this.setup.preRequest?.(computedArgs) ?? computedArgs;
  }

  /**
   * runs the configured parser
   */
  private parseCommandResult<Request extends RequestRequest<Setup>>(
    rawResult: I_WE_Response_T,
    request: Request
  ): RequestResponse<Setup, Request> {
    const [operation, action] = this.identifyRequest(request);
    const specReq = request[operation][action];
    const val = this.setup.requests[operation][action].parseRes(
      rawResult,
      specReq
    );
    return val;
  }
  /**
   * get operator and action for the command as usable values (+ fancy typing)
   */
  private identifyRequest<
    Request extends RequestRequest<Setup>,
    Operation extends keyof Request = keyof Request,
    Action extends keyof Request[Operation] = keyof Request[Operation]
  >(request: Request): [Extract<Operation, string>, Extract<Action, string>] {
    const operation = Object.keys(request)[0] as Extract<Operation, string>;
    const action = Object.keys(request[operation])[0] as Extract<
      Action,
      string
    >;
    return [operation, action];
  }
}
