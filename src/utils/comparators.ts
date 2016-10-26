import { Moment } from 'moment';
import { Localizable } from '../entities/contract';
import { isDefined, Optional } from '../utils/object';
import { Localizer } from '../utils/language';

export interface Comparator<T> {
  (lhs: T, rhs: T): number;
}

export interface ChainableComparator<T> extends Comparator<T> {
  andThen(other: Comparator<T>): ChainableComparator<T>;
}

export function reversed<T>(comparator: Comparator<T>): ChainableComparator<T> {
  return makeChainable((lhs: T, rhs: T) => comparator(rhs, lhs));
}

export function comparingPrimitive<T>(extractor: (item: T) => Optional<string|number|boolean>): ChainableComparator<T> {
  return makeChainable((lhs: T, rhs: T) => optionalComparator(extractor(lhs), extractor(rhs), primitiveComparator));
}

export const comparingNumber = comparingPrimitive;
export const comparingString = comparingPrimitive;
export const comparingBoolean = comparingPrimitive;

export function comparingDate<T>(extractor: (item: T) => Optional<Moment>): ChainableComparator<T> {
  return makeChainable((lhs: T, rhs: T) => optionalComparator(extractor(lhs), extractor(rhs), dateComparator));
}

export function comparingLocalizable<T>(localizer: Localizer, extractor: (item: T) => Optional<Localizable>) {
  return makeChainable((lhs: T, rhs: T) => optionalComparator(extractor(lhs), extractor(rhs), createLocalizableComparator(localizer)));
}

function optionalComparator<T>(lhs: Optional<T>, rhs: Optional<T>, comparator: Comparator<T>) {
  if (isDefined(lhs) && !isDefined(rhs)) {
    return 1;
  } else if (!isDefined(lhs) && isDefined(rhs)) {
    return -1;
  } else {
    return comparator(lhs!, rhs!);
  }
}

function primitiveComparator<T extends string|number|boolean>(lhs: T, rhs: T) {
  return lhs === rhs ? 0 : lhs > rhs ? 1 : -1;
}

function dateComparator(lhs: Moment, rhs: Moment) {
  if (lhs.isAfter(rhs)) {
    return 1;
  } else if (lhs.isBefore(rhs)) {
    return -1;
  } else {
    return 0;
  }
}

function createLocalizableComparator(localizer: Localizer): Comparator<Localizable> {
  return (lhs: Localizable, rhs: Localizable) => {
    return primitiveComparator(localizer.translate(lhs), localizer.translate(rhs));
  };
}

function makeChainable<T>(comparator: Comparator<T>): ChainableComparator<T> {
  (<any> comparator).andThen = (next: Comparator<T>) => makeChainable(chain(comparator, next));
  return <ChainableComparator<T>> comparator;
}

function chain<T>(current: Comparator<T>, next: Comparator<T>): Comparator<T> {
  return (lhs: T, rhs: T) => {
    const currentComparison = current(lhs, rhs);
    if (currentComparison !== 0) {
      return currentComparison;
    } else {
      return next(lhs, rhs);
    }
  };
}
