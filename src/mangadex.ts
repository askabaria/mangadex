import { MangaArguments } from "@manga/arguments";
import { InteractiveRunner } from "@manga/mode-interactive";

new MangaArguments(process.argv.slice(2))
  .registerRunner("interactive", new InteractiveRunner())
  .run();
