import { ObjectEntries, RequireAtLeastOne, RequireOnlyOne } from "@aska/utils";
// @todo: indirect to be used in the browser (eg. via an adapter that simulates/communicates with another server/service)
import { execSync } from "child_process";

export type CE_CommandsStruct<
  Target,
  OPERATORS extends string = string,
  ACTIONS extends Record<OPERATORS, string> = Record<OPERATORS, string>
> = {
  [OPERATOR in OPERATORS]: {
    [ACTION in ACTIONS[OPERATOR]]: Target;
  };
};

export type CE_REQONE<
  Target,
  OPERATORS extends string = string,
  ACTIONS extends Record<OPERATORS, string> = Record<OPERATORS, string>
> = RequireOnlyOne<{
  [OPERATOR in OPERATORS]: RequireOnlyOne<{
    [ACTION in ACTIONS[OPERATOR]]: Target;
  }>;
}>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- @todo: review
type DScope = Record<string, any> | undefined;
export type CE_CommandDef<PartOptions, ReturnValue, Scope = DScope> = {
  /**
   * render options into command parameters
   *
   * returning a string is 1:1
   * returning a record will use `${key} ${value}`.join(' ') for string values and keys.join(' ') for true values
   *
   * false will be filtered out, '' won't append any argument (except globally configured ones)
   */
  renderArgs: (
    options: PartOptions,
    scope: Scope
  ) => Record<string, string | boolean> | string;
  /**
   * construct an object from the command output to give to the user
   * @todo: add more process info (like return code; etc.)
   */
  parseRes: (
    result: string,
    options: PartOptions,
    scope: DScope
  ) => ReturnValue;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- @todo: review
export type CE_CommandsDef<Scope = DScope> = CE_CommandsStruct<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- inferred
  CE_CommandDef<any, any, DScope>
>;

export type CE_Setup<
  Scope = DScope,
  Commands extends CE_CommandsDef<Scope> = CE_CommandsDef<Scope>,
  SkipsResultToString extends boolean = false
> = {
  /**
   * how many layers of the setup-chain should be literally part of the command to execute?
   */
  autoParamDepth?: 0 | 1 | 2;

  /**
   * commands to implement
   */
  commands: Commands;

  /**
   * @default false
   */
  skipResultToString?: SkipsResultToString;
};

/**
 * infer command type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- inferred
export type UCE_SetCommands<S extends CE_Setup<any, any, boolean>> =
  S extends CE_Setup<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- @todo: review
    any,
    infer C,
    boolean
  >
    ? C
    : never;

/**
 * infer params for command
 */
export type UCE_CmdParams<
  C extends CE_CommandsDef,
  Operation extends string,
  Action extends string
> = C extends {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- inferred
  [op in Operation]: { [ac in Action]: CE_CommandDef<infer Params, any> };
}
  ? Params
  : never;
/**
 * infer result of command
 */
export type UCE_CmdResult<
  C extends CE_CommandsDef,
  Operation extends string,
  Action extends string
> = C extends {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- inferred
  [op in Operation]: { [ac in Action]: CE_CommandDef<any, infer Result> };
}
  ? Result
  : never;

/**
 * @todo: export with class-adapter
 * interface type to infer the requests that can be made
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- inferred
export type CommandRequest<Setup extends CE_Setup<any, any, boolean>> =
  RequireAtLeastOne<{
    [Operation in keyof UCE_SetCommands<Setup>]: RequireAtLeastOne<{
      [Action in keyof UCE_SetCommands<Setup>[Operation]]: UCE_CmdParams<
        UCE_SetCommands<Setup>,
        Extract<Operation, string>,
        Extract<Action, string>
      >;
    }>;
  }>;

/**
 * @todo: export with class-adapter
 * interface type to infer the requests that can be made
 */
export type CommandResponse<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- inferred
  Setup extends CE_Setup<any, any, boolean>,
  Request extends CommandRequest<Setup>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- inferred
> = Request extends Record<infer Op, Record<infer Ac, any>>
  ? UCE_CmdResult<
      UCE_SetCommands<Setup>,
      Extract<Op, string>,
      Extract<Ac, string>
    >
  : never;

/**
 * usable as a configurable member variable that is capable of simple defined commandline executions
 *
 * @todo: allow for std-in to be given to commands?
 *
 * @todo: create type that can compare/etc. different executors for:
 * - the possibility to make a method that accepts an executor that matches certain needed issue-params and accepts any executor that implements those for generic command-handling!
 * - and a type that helps make those requests
 *
 * @todo: make `Scope` typed in commands...
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- inferred
export class CommandExecutor<
  C extends CE_CommandsDef,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- @todo: review
  Scope extends Record<string, any> | undefined = undefined,
  Setup extends CE_Setup<Scope, C, boolean> = CE_Setup<Scope, C, boolean>
> {
  // set from main script
  public static readonly PROJECT_ROOT = process.cwd();

  private scopeStack: Partial<Exclude<Scope, undefined>>[] = [];

  constructor(
    /**
     * cli command name to execute (prevents accidental typos)
     */
    private commandName: string,
    /**
     * how arguments should be derived from issued calls and their options
     * and how to parse the commands result into sensible data
     */
    private setup: Setup,
    private scopeCfg?: {
      /**
       * a default scope setting to use
       */
      defaultScope: Scope;
      /**
       * callbacks run right before and after a command if a scope is currently active
       *
       * every command gets scoped right before and right after it's execution
       * this generates some more redundant switching (eg. many pushd+popd's) of states
       * BUT maintains a clean base-state and produces deterministic behavior (as long as not to many commands are executed inside scope-hooks...; stick with pushD+popD pairings as much as possible)
       */
      onActiveScope?: {
        /**
         * default/expected behavior is parsedReturn passthrough
         *
         * can be used to pushd the directory, change configs (temporary until afterCommand) or modify the commandArgs by appending a `--dry-run`/etc.
         */
        beforeCommand?: (
          fullScope: Exclude<Scope, undefined>,
          scopeStack: Partial<Exclude<Scope, undefined>>[],
          commandArgs: string
        ) => string | undefined | void;

        /**
         * default/expected behavior is parsedReturn passthrough
         *
         * can be used to do cleanup like revert config-changes or popd
         */
        afterCommand?: <T>(
          fullScope: Exclude<Scope, undefined>,
          scopeStack: Partial<Exclude<Scope, undefined>>[],
          parsedReturn: T
        ) => T | undefined | void;
      };
    }
  ) {}

  /**
   * retrieve the currently compiled scope stack
   */
  getCurrentScope(): Scope {
    const cScope = { ...this.scopeCfg?.defaultScope } as Exclude<
      Scope,
      undefined
    >;
    for (const stacked of this.scopeStack) {
      // @todo: does the ObjectEntries<> cast work correctly?
      for (const [key, val] of Object.entries(stacked) as ObjectEntries<
        Exclude<Scope, undefined>[]
      >) {
        cScope[key] = val;
      }
    }
    return Object.keys(cScope).length === 0
      ? (this.scopeCfg?.defaultScope as Scope)
      : cScope;
  }

  /**
   * run some commands with scoped data arguments
   */
  runInScope<T>(
    subScope: Partial<Exclude<Scope, undefined>>,
    scopedFn: () => T
  ): T {
    this.scopeStack.push(subScope);
    const r = scopedFn();
    this.scopeStack.pop();
    return r;
  }

  /**
   * issues a command to be executed and parsed
   */
  issue<Request extends CommandRequest<Setup>>(
    request: Request,
    doThrow = false
  ): CommandResponse<Setup, Request> {
    const cScope = this.getCurrentScope();
    const cmd = this.renderCommand(request, cScope);
    let result = "";
    try {
      // @todo: reintroduce log output
      //   const vMode = this.cfg().get('show-commands');
      //   if (vMode !== 'false' && vMode && String(vMode).trim().length > 0) {
      //     const vStr = (
      //       (vMode === 'with-path'
      //         ? `${UNFUCK_Chalk.yellow(
      //             process
      //               .cwd()
      //               .substring(CommandExecutor.PROJECT_ROOT.length + 1),
      //           )} ${UNFUCK_Chalk.greenBright('$')}`
      //         : '') + ` ${UNFUCK_Chalk.cyan(cmd)}`
      //     ).trim();
      //     console.log(vStr);
      //   }
      result = execSync(cmd) as any as string;
      if (!this.setup.skipResultToString) {
        result = result.toString();
      }
    } catch (e: any) {
      if (doThrow) {
        throw new Error(`could not execute ${cmd}`);
      }
      // 1: stdout; 2: stderr?
      result = e.output?.[2]?.toString() ?? "";
    }
    return this.parseCommandResult(result, request, cScope);
  }

  /**
   * runs the configured parser
   */
  private parseCommandResult<Request extends CommandRequest<Setup>>(
    rawResult: string,
    request: Request,
    scope: Scope
  ): CommandResponse<Setup, Request> {
    const [operation, action] = this.identifyRequest(request);
    const specReq = request[operation][action];
    const val = this.setup.commands[operation][action].parseRes(
      rawResult,
      specReq,
      scope
    );

    if (
      this.scopeStack.length > 0 &&
      this.scopeCfg?.onActiveScope?.afterCommand !== undefined
    ) {
      const nVal = this.scopeCfg.onActiveScope.afterCommand(
        scope /* with existing stack can be assumed not undefined */ as Exclude<
          Scope,
          undefined
        >,
        this.scopeStack,
        val
      );
      if (nVal) {
        return nVal;
      }
    }
    return val;
  }

  /**
   * renders options into commands using local configs and configured argument-transformers
   */
  private renderCommand<Request extends CommandRequest<Setup>>(
    request: Request,
    scope: Scope
  ): string {
    const [operation, action] = this.identifyRequest(request);
    const literals =
      this.setup.autoParamDepth === 0
        ? ""
        : " " +
          operation +
          (this.setup.autoParamDepth === 2 ? " " + action : "");
    let computedArgs = this.setup.commands[operation][action].renderArgs(
      request[operation][action],
      scope
    );

    if (typeof computedArgs !== "string") {
      computedArgs = (
        Object.entries(computedArgs) as [string, string | boolean][]
      )
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- @todo: review
        .filter(([name, val]) => val)
        .map(([name, val]) => `${name}${val !== true ? ` ${val}` : ""}`)
        .join(" ");
    }
    if (
      this.scopeStack.length > 0 &&
      this.scopeCfg?.onActiveScope?.beforeCommand !== undefined
    ) {
      const nVal = this.scopeCfg.onActiveScope.beforeCommand(
        scope /* with existing stack can be assumed not undefined */ as Exclude<
          Scope,
          undefined
        >,
        this.scopeStack,
        computedArgs
      );
      if (nVal) {
        computedArgs = nVal;
      }
    }
    computedArgs = computedArgs.trim();
    if (computedArgs.length > 0) {
      computedArgs = ` ${computedArgs}`;
    }

    return this.commandName + literals + computedArgs;
  }

  /**
   * get operator and action for the command as usable values (+ fancy typing)
   */
  private identifyRequest<
    Request extends CommandRequest<Setup>,
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
