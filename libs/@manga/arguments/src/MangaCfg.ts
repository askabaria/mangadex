export class MangaCfg<Structure> {
  private cfg;
  constructor(private defaults: Structure) {
    this.cfg = structuredClone(this.defaults);
  }
  initialize(includes: string, overrides: Record<string, string[]>) {
    this.cfg = structuredClone(this.defaults);

  }
}
