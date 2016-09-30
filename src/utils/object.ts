import * as _ from 'lodash';

export type EqualityChecker<T> = (lhs: T, rhs: T) => boolean;

export function referenceEquality<T>(lhs: T, rhs: T) {
  return lhs === rhs;
}

export function areEqual<T>(lhs: T, rhs: T, equals: EqualityChecker<T> = referenceEquality): boolean {
  if ((isDefined(lhs) && !isDefined(rhs)) || (!isDefined(lhs) && isDefined(rhs))) {
    return false;
  } else if (!isDefined(lhs) && !isDefined(rhs)) {
    return true;
  } else {
    return equals(lhs, rhs);
  }
}

export function isDefined(obj: any): boolean {
  return obj !== null && obj !== undefined;
}

export function isString(str: any): str is string {
  return typeof str === 'string';
}

export function isNumber(str: any): str is number {
  return typeof str === 'number';
}

export function hasValue(obj: any) {
  for (const value of Object.values(obj)) {
    if (!!value) {
      return true;
    }
  }
  return false;
}

interface MapLike<V> {
  [index: string]: V;
}

export function valuesExcludingKeys<V>(obj: MapLike<V>, exclude: Set<string>): V[] {
  return _.chain(Object.entries(obj))
    .filter(entry => !exclude.has(entry[0]))
    .map(entry => entry[1])
    .value();
}

export function assertNever(_x: never, msg?: string) {
  throw new Error(msg);
}
