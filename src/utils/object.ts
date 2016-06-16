import * as _ from 'lodash';

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
