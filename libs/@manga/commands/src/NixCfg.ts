import { CommandExecutor } from "@aska/commands";

const log = (...args: any[]) => {};

export const nixCfg = new CommandExecutor(
  "nix-instantiate",
  {
    autoParamDepth: 0,
    commands: {
      file: {
        run: {
          renderArgs(
            {
              file,
              env = {},
              skipImports = false,
            }: {
              file: string;
              env?: Record<string, any>;
              skipImports?: boolean;
            },
            scope
          ) {
            return {
              "--strict": "--json",
              "--eval": file,
            };
          },
          parseRes(
            result,
            {
              file,
              env = {},
              skipImports = false,
            }: {
              file: string;
              env?: Record<string, any>;
              skipImports?: boolean;
            },
            scope
          ) {
            try {
              const obj = JSON.parse(result);
              // @todo: resolve and import "imports=[...];" intul it stays unchanged
              if (skipImports) {
                return obj;
              }
              return obj;
            } catch (e) {
              // if tried with file and result mentions "function" -> import with env
            }
          },
        },
      },
    },
  },
  {
    defaultScope: {
      imports: [],
    },
  }
);
