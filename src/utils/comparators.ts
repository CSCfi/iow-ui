import { Moment } from 'moment';
import { Localizable } from '../entities/contract';
import { isDefined } from '../utils/object';
import { translate, Localizer } from '../utils/language';

export interface Comparator<T> {
  (lhs: T, rhs: T): number;
}

export interface ChainableComparator<T> extends Comparator<T> {
  andThen(other: Comparator<T>): ChainableComparator<T>;
}

type Optional<T> = T|null|undefined;

function compareOptional<T>(lhs: Optional<T>, rhs: Optional<T>, comparator: (l: T, r: T) => number): number {
  if (isDefined(lhs) && !isDefined(rhs)) {
    return 1;
  } else if (!isDefined(lhs) && isDefined(rhs)) {
    return -1;
  } else {
    return comparator(lhs!, rhs!);
  }
}

function comparePrimitive<T extends string|number|boolean>(lhs: T, rhs: T): number {
  return lhs === rhs ? 0 : lhs > rhs ? 1 : -1;
}

function compareDate(lhs: Moment, rhs: Moment): number {
  if (lhs.isAfter(rhs)) {
    return 1;
  } else if (lhs.isBefore(rhs)) {
    return -1;
  } else {
    return 0;
  }
}

function compareLocalizable(localizer: Localizer) {
  return (lhs: Localizable, rhs: Localizable) => {
    const language = localizer.language;
    return comparePrimitive(translate(lhs, language).toLowerCase(), translate(rhs, language).toLowerCase());
  };
}

export function reversed<T>(comparator: Comparator<T>): ChainableComparator<T> {
  return makeChainable((lhs: T, rhs: T) => comparator(rhs, lhs));
}

export function comparingString<T>(extractor: (item: T) => Optional<string>): ChainableComparator<T> {
  return makeChainable((lhs: T, rhs: T) => compareOptional(extractor(lhs), extractor(rhs), comparePrimitive));
}

export function comparingNumber<T>(extractor: (item: T) => Optional<number>): ChainableComparator<T> {
  return makeChainable((lhs: T, rhs: T) => compareOptional(extractor(lhs), extractor(rhs), comparePrimitive));
}

export function comparingBoolean<T>(extractor: (item: T) => Optional<boolean>): ChainableComparator<T> {
  return makeChainable((lhs: T, rhs: T) => compareOptional(extractor(lhs), extractor(rhs), comparePrimitive));
}

export function comparingDate<T>(extractor: (item: T) => Optional<Moment>): ChainableComparator<T> {
  return makeChainable((lhs: T, rhs: T) => compareOptional(extractor(lhs), extractor(rhs), compareDate));
}

export function comparingLocalizable<T>(localizer: Localizer, extractor: (item: T) => Optional<Localizable>) {
  return makeChainable((lhs: T, rhs: T) => compareOptional(extractor(lhs), extractor(rhs), compareLocalizable(localizer)));
}

export function makeChainable<T>(comparator: Comparator<T>): ChainableComparator<T> {
  (<any> comparator).andThen = (next: Comparator<T>) => makeChainable(chain(comparator, next));
  return <ChainableComparator<T>> comparator;
}

export function chain<T>(current: Comparator<T>, next: Comparator<T>): Comparator<T> {
  return (lhs: T, rhs: T) => {
    const currentComparison = current(lhs, rhs);
    if (currentComparison !== 0) {
      return currentComparison;
    } else {
      return next(lhs, rhs);
    }
  };
}
