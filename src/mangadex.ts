import { MangaArguments } from "@manga/arguments";
import { InteractiveRunner } from "@manga/mode-interactive";
import { DevRunner } from "@manga/mode-dev";
import {
  from,
  map,
  merge,
} from "rxjs";
import { rateLimit } from "@aska/utils";


// const d = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// const rl = rateLimit<number>({ tokens: 5, reuseTime: 5000, name: "rate" });

// const a = from([...d]).pipe(
//   rateLimit<any>({ tokens: 2, reuseTime: 1000, name: "feed:A" }),
//   rl
// );
// const b = from([...d]).pipe(
//   rateLimit<any>({ tokens: 2, reuseTime: 1000, name: "feed:B" }),
//   rl,
//   map((e) => e * 10)
// );
// let x = 0;
// merge(a, b).subscribe((v) => console.log(`${++x} : ${v}`));

new MangaArguments(process.argv.slice(2))
  .registerRunners({
    dev: new DevRunner(),
    interactive: new InteractiveRunner(),
  })
  .run();
