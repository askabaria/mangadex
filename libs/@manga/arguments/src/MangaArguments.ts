/**
 * implement this to implement `--run` values that can be passed and handle what to run, defaults to internal interactive mode
 */
export interface Runner {
  /**
   * @todo: return more information than "execution-success"?
   */
  run(args: MangaArguments): boolean;
}

/**
 * parses arguments
 * manages configuration file
 */
export class MangaArguments {
  private static instance: undefined | MangaArguments = undefined; // singleton...
  public static defaultConfiguration = {
    /**
     * configuration file location
     */
    configuration: "./.mangadex/cfg.nix",
    /**
     * activated subscriptions (what gets modified/etc. by the script)
     */
    subscriptions: [],
    /**
     * where to put downloaded files
     */
    target: "./.mangadex/output",
    /**
     * what mode to run
     *
     * can be one of all the registered run modes, defaults to "interactive" client
     */
    run: "interactive",
  } as const;
  private configuration = structuredClone(MangaArguments.defaultConfiguration);
  private collected: Record<string, [string] | string[]> = {};

  private runners: Record<string, Runner> = {};

  constructor(args: string[]) {
    if (MangaArguments.instance === undefined) {
      this.setup(args);
      MangaArguments.instance = this;
    } else {
      /**
       * when you stumble across this, you might prefer passing down your used environment/parameters isntead of requesting a new instance...
       */
      console.trace("please stay functional...");
    }
    return MangaArguments.instance;
  }

  /**
   * resets environment and recalculates configurations
   *
   * @warning this influences global state
   * @warning ONLY USE ON TOP-LEVEL-SCRIPTS TO PROGRAMATICALLY RUN SEQUENTIALLY ON MULTIPLE PROEJCTS!!!
   * -> that's why it's exposed, otherwise it would be internal
   */
  setup(args: string[]) {
    // reset
    this.configuration = structuredClone(MangaArguments.defaultConfiguration);
    this.collected = {};
    /**
     * parse args into flag-groups
     */
    let current: string = "";
    for (const arg of args) {
      if (arg.startsWith("--")) {
        current = arg;
        this.collected[current] = this.collected[current] ?? [];
        continue;
      }
      this.collected[current].push(arg);
    }

    console.log(this.collected);
  }

  registerRunner(name: string, runner: Runner) {
    this.runners[name] = runner;
    return this;
  }

  run() {
    const rTarget = this.configuration.run;
    const availRunners = Object.keys(this.runners);
    if (!availRunners.includes(rTarget)) {
      throw new Error(
        `unknown run-target [${rTarget}], available are: [${availRunners.join(
          ", "
        )} ]`
      );
    }
    return this.runners[rTarget].run(this);
  }
}
