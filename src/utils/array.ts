import { isDefined } from './object';

export function normalizeAsArray<T>(obj: T|T[]): T[] {
  return Array.isArray(obj) ? obj : isDefined(obj) ? [obj] : [];
}

export function moveElement<T>(array: T[], fromIndex: number, toIndex: number, indexChangedCb?: (item: T, index: number) => void) {

  if (fromIndex >= array.length || fromIndex < 0) {
    throw new Error('From index out of bounds: ' + fromIndex);
  }

  if (toIndex >= array.length || toIndex < 0) {
    throw new Error('Index2 out of bounds: ' + toIndex);
  }

  const value = array.splice(fromIndex, 1);
  array.splice(toIndex, 0, value[0]);

  if (indexChangedCb) {
    indexChangedCb(array[toIndex], toIndex);

    if (fromIndex < toIndex) {
      for (let i = fromIndex; i < toIndex; i++) {
        indexChangedCb(array[i], i);
      }
    } else if (fromIndex > toIndex) {
      for (let i = toIndex + 1; i <= fromIndex; i++) {
        indexChangedCb(array[i], i);
      }
    }
  }
}

export function swapElements<T>(array: T[], index1: number, index2: number, indexChangedCb?: (item: T, index: number) => void) {

  if (index1 >= array.length || index1 < 0) {
    throw new Error('Index1 out of bounds: ' + index1);
  }

  if (index2 >= array.length || index1 < 0) {
    throw new Error('Index2 out of bounds: ' + index1);
  }

  const temp = array[index1];
  array[index1] = array[index2];
  array[index2] = temp;

  if (indexChangedCb) {
    indexChangedCb(array[index1], index1);
    indexChangedCb(array[index2], index2);
  }
}

export function resetWith<T>(array: T[], toResetWith: T[]) {
  array.splice(0, array.length);
  for (const item of toResetWith) {
    array.push(item);
  }
}

export type EqualityChecker<T> = (lhs: T, rhs: T) => boolean;

export function referenceEquality<T>(lhs: T, rhs: T) {
  return lhs === rhs;
}

export function any<T>(arr: T[], predicate: (item: T) => boolean) {
  for (const item of arr) {
    if (predicate(item)) {
      return true;
    }
  }
  return false;
}

export function all<T>(arr: T[], predicate: (item: T) => boolean) {
  for (const item of arr) {
    if (!predicate(item)) {
      return false;
    }
  }
  return true;
}

export function contains<T>(arr: T[], value: T, equals: EqualityChecker<T> = referenceEquality): boolean {
  return any(arr, (item: T) => equals(item, value));
}

export function containsAny<T>(arr: T[], values: T[], equals: EqualityChecker<T> = referenceEquality): boolean {
  return any(values, (value: T) => contains(arr, value, equals));
}

export function containsAll<T>(arr: T[], values: T[], equals: EqualityChecker<T> = referenceEquality): boolean {
  return all(values, (value: T) => contains(arr, value, equals));
}

export function arraysAreEqual<T>(lhs: T[], rhs: T[], equals: EqualityChecker<T> = referenceEquality) {
  return containsAll(lhs, rhs, equals) && containsAll(rhs, lhs, equals);
}

export function findFirstMatching<T>(arr: T[], values: T[], equals: EqualityChecker<T> = referenceEquality): T {
  for (const value of values) {
    for (const item of arr) {
      if (equals(item, value)) {
        return item;
      }
    }
  }
  return null;
}
