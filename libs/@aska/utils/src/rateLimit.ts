import {
  asyncScheduler,
  SchedulerLike,
  MonoTypeOperatorFunction,
  BehaviorSubject,
  filter,
  mergeMap,
  take,
  catchError,
  timer,
  map,
} from "rxjs";

export function rateLimit<T>({
  tokens,
  reuseTime = 1000,
  scheduler = asyncScheduler,
  name = "",
}: {
  tokens: number;
  reuseTime: number;
  scheduler?: SchedulerLike;
  name?: string;
}): MonoTypeOperatorFunction<T> {
  const tokenDepleted = Symbol("aska:rateLimit:tokenDepleted:retry");
  const $tokens = new BehaviorSubject(tokens);
  const consumeToken = () => {
    const c = $tokens.getValue();
    if (c <= 0) {
      throw tokenDepleted;
    }
    // mathy floor is for keeping only 1 decimal for logging...
    console.log(`rate-tokens ${c-1} / ${tokens} @ ${name} used (for ${Math.floor(reuseTime/100)/10}s)`);
    return $tokens.next(c - 1);
  };
  const renewToken = () =>{
    console.log(`rate-tokens ${$tokens.getValue() + 1} / ${tokens} @ ${name} renewed`);
     return $tokens.next($tokens.getValue() + 1);
  }
  const tokenAvailable$ = $tokens.pipe(filter((t) => t > 0));

  return (i) =>
    i.pipe(
      mergeMap((value) =>
        tokenAvailable$.pipe(
          take(1),
          map(() => {
            consumeToken();
            timer(reuseTime, scheduler).subscribe(renewToken);
            return value;
          }),
          catchError((err, source) => {
            if (err === tokenDepleted) {
              return source;
            }
            throw err;
          })
        )
      )
    );
}
