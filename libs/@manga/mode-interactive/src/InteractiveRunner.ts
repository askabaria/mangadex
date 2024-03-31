import { MangaArguments, Runner } from "@manga/arguments";

export class InteractiveRunner implements Runner {
  run(args: MangaArguments): boolean {
    let run = true;
    let refreshAfter = true;
    while (run) {

     throw new  Error("@todo: implement interactive mode");

    }
    if (refreshAfter) {
      throw new  Error("@todo: trigger cfg-refresh");

    }
    return false;
  }
}
