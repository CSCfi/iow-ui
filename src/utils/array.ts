import { isDefined } from './object';

export function normalizeAsArray<T>(obj: T|T[]): T[] {
  return Array.isArray(obj) ? obj : isDefined(obj) ? [obj] : [];
}

export function moveElement<T>(array: T[], fromIndex: number, toIndex: number, indexChangedCb?: (item: T, index: number) => void) {
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

export function containsAny<T>(arr: T[], values: T[]): boolean {
  return findFirstMatching(arr, values) !== null;
}

export function findFirstMatching<T>(arr: T[], values: T[]): T {
  for (const value of values) {
    for (const item of arr) {
      if (item === value) {
        return item;
      }
    }
  }
  return null;
}


export function arraysAreEqual<T>(lhs: T[], rhs: T[]) {

  function rhsContains(item: T) {
    for (const r of rhs) {
      if (r === item) {
        return true;
      }
    }

    return false;
  }

  for (const l of lhs) {
    if (rhsContains(l)) {
      return true;
    }
  }

  return false;
}
