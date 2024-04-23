import { merge } from "lodash";
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
    configuration: "~/.mangadex/cfg.nix",
    /**
     * activated subscriptions (what gets modified/etc. by the script)
     */
    subscriptions: [],
    /**
     * current state of stored data
     */
    state: [],
    /**
     * where to put downloaded files
     */
    target: "/mnt/c/Users/fabia/OneDrive/Bilder/Manga",
    /**
     * what mode to run
     *
     * can be one of all the registered run modes, defaults to "interactive" client
     */
    run: ["dev"],
  };
  private configuration = structuredClone(MangaArguments.defaultConfiguration);

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
    const collected: Record<string, [string] | string[]> = {};
    /**
     * parse args into flag-groups
     */
    let current: string = "";
    for (const arg of args) {
      if (arg.startsWith("--")) {
        current = arg.substring(2);
        collected[current] = collected[current] ?? [];
        continue;
      }
      collected[current].push(arg);
    }
    this.configuration = merge(this.configuration, collected);
  }

  registerRunners(runners: Record<string, Runner>) {
    this.runners = {
      ...this.runners,
      ...runners,
    };
    return this;
  }
  registerRunner(name: string, runner: Runner) {
    this.runners[name] = runner;
    return this;
  }

  run() {
    const r = [];
    const rTargets = this.configuration.run;
    const availRunners = Object.keys(this.runners);
    for (const rTarget of rTargets) {
      if (!availRunners.includes(rTarget)) {
        throw new Error(
          `unknown run-target [${rTarget}], available are: [${availRunners.join(
            ", "
          )} ]`
        );
      }
      r.push(this.runners[rTarget].run(this));
      if (!r[r.length - 1]) {
        break;
      }
    }
    return r;
  }

  /**
   * values return their objects, arguments are string-arrays
   */
  get(primaryKey: string): string[] {
    // @todo: replace this ~~cra~~.......... stuff with the advanced argument mapper, once I sifted through my backups...
    let v = (this.configuration as any)[primaryKey];
    if (typeof v === 'string') {
      v = [v];
    }
    return v;
  }
}
