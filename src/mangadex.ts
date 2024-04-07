import { MangaArguments } from "@manga/arguments";
import { InteractiveRunner } from "@manga/mode-interactive";
import { DevRunner } from "@manga/mode-dev";

new MangaArguments(process.argv.slice(2))
  .registerRunners({
    dev: new DevRunner(),
    interactive: new InteractiveRunner(),
  })
  .run();
