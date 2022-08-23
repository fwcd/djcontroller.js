/** A lazily-initialized/cached value. */
export class Cached<T> {
  private value?: T;

  get(getter: () => T): T {
    if (this.value === undefined) {
      this.value = getter();
    }
    return this.value;
  }
}
