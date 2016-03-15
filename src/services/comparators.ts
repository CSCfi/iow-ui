
export interface Comparator<T> {
  (lhs: T, rhs: T): number
}

export interface ChainableComparator<T> extends Comparator<T> {
  andThen(other: Comparator<T>): ChainableComparator<T>;
}

function afterComparingExistence<T>(l: T, r: T, compare: (l: T, r: T) => boolean): number {
  if (l === r) {
    return 0;
  } else if (!!l && !r) {
    return 1;
  } else if (!l && !!r) {
    return -1;
  } else {
    return compare(l, r) ? 1 : -1;
  }
}

export function compareStrings(l: string, r: string): number {
  return afterComparingExistence(l, r, (lhs, rhs) => lhs > rhs);
}

export function compareNumbers(l: number, r: number): number {
  return afterComparingExistence(l, r, (lhs, rhs) => lhs > rhs);
}

export function compareBooleans(l: boolean, r: boolean): number {
  return afterComparingExistence(l, r, (lhs, rhs) => lhs === true);
}

export function reversed<T>(comparator: Comparator<T>): ChainableComparator<T> {
  return addChaining((lhs: T, rhs: T) => comparator(rhs, lhs));
}

export function comparingString<T>(extractor: (item: T) => string): ChainableComparator<T> {
  return addChaining((lhs: T, rhs: T) => compareStrings(extractor(lhs), extractor(rhs)));
}

export function comparingNumber<T>(extractor: (item: T) => number): ChainableComparator<T> {
  return addChaining((lhs: T, rhs: T) => compareNumbers(extractor(lhs), extractor(rhs)));
}

export function comparingBoolean<T>(extractor: (item: T) => boolean): ChainableComparator<T> {
  return addChaining((lhs: T, rhs: T) => compareBooleans(extractor(lhs), extractor(rhs)));
}

function chain<T>(current: Comparator<T>, next: Comparator<T>): ChainableComparator<T> {
  return addChaining((lhs: T, rhs: T) => {
    const currentComparison = current(lhs, rhs);
    if (currentComparison !== 0) {
      return currentComparison;
    } else {
      return next(lhs, rhs);
    }
  });
}

function addChaining<T>(comparator: Comparator<T>): ChainableComparator<T> {
  (<any> comparator).andThen = (next: Comparator<T>) => chain(comparator, next);
  return <ChainableComparator<T>> comparator;
}
