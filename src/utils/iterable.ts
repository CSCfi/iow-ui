
export namespace Iterable {
  export function forEach<T>(iterable: Iterable<T>, callback: (item: T) => void): void {
    const iterator = iterable[Symbol.iterator]();
    for (let next = iterator.next(); next.value !== undefined; next = iterator.next()) {
      callback(next.value);
    }
  }
}
