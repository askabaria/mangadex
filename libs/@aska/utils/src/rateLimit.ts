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
  finalize,
  delay,
  tap,
} from "rxjs";

export function rateLimit<T>({
  tokens,
  reuseTime = 1000,
  scheduler = asyncScheduler,
  timerOnClose = true,
  name = "",
}: {
  // number of available tokens
  tokens: number;
  // time after "free" until a token can be reused
  reuseTime: number;
  // scheduler to use for timing
  scheduler?: SchedulerLike;
  // defaults to setting the "renew" on finalize instead of when requesting (=>false)
  timerOnClose?: boolean;
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
    console.log(`rate-tokens ${c-1} / ${tokens} @ ${name} ${
      timerOnClose ?
        `in use...` :
        `used (for ${Math.floor(reuseTime/100)/10}s)`
    }`);
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
            if(!timerOnClose){
              timer(reuseTime, scheduler).subscribe(renewToken);
            }
            return value;
          }),
          tap({
            complete: ()=>{
            if(timerOnClose) {
              console.log(`rate-tokens ${$tokens.getValue()} / ${tokens} @ ${name} use complete; scheduling renew in ${Math.floor(reuseTime/100)/10}`);
              timer(reuseTime, scheduler).subscribe(renewToken);
            }
          },}),
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
