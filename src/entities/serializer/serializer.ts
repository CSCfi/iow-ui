import { isDefined } from '../../utils/object';
import { normalizeAsArray, filterDefined } from '../../utils/array';
import Moment = moment.Moment;
import moment = require('moment');
import { Localizable, Coordinate, UserLogin } from '../contract';
import { Language } from '../../utils/language';
import { Type, mapType, reverseMapType } from '../type';

export interface Serializer<T> {
  type: 'Normal';
  serialize(data: T): any;
  deserialize(data: any): T;
}

export function createSerializer<T>(serialize: (data: T) => any, deserialize: (data: any) => T): Serializer<T> {
  return {
    type: 'Normal',
    serialize,
    deserialize
  };
}

export function identitySerializer<T>(): Serializer<T> {
  return createSerializer(
    (data: T) => {
      const runtimeCheckValue = data as any;
      if (typeof runtimeCheckValue === 'string' && runtimeCheckValue.length === 0) {
        return null;
      } else {
        return data;
      }
    },
    (data: any) => data as T
  );
}

export function optional<T>(serializer: Serializer<T>): Serializer<T|null> {
  return createSerializer(
    (data: T|null) => isDefined(data) ? serializer.serialize(data) : null,
    (data: any) => isDefined(data) ? serializer.deserialize(data) : null
  );
}

export function valueOrDefault<T>(serializer: Serializer<T>, defaultData: any): Serializer<T> {
  return createSerializer(
    (data: T) => serializer.serialize(data),
    (data: any) => serializer.deserialize(isDefined(data) ? data : defaultData)
  );
}

export function list<T>(serializer: Serializer<T>, defaultList?: T[]): Serializer<T[]> {
  return createSerializer(
    (data: T[]) => {
      if (data.length === 0) {
        return defaultList ? defaultList : null;
      } else {
        return data.map(d => serializer.serialize(d));
      }
    },
    (data: any) => normalizeAsArray(data).map(d => serializer.deserialize(d))
  );
}

export const localizableSerializer: Serializer<Localizable> = createSerializer(
  (data: Localizable) => Object.assign({}, data),
  (data: any) => {
    const result: Localizable = {};

    if (data) {
      for (const lang of Object.keys(data)) {
        const value = data[lang];
        result[lang] = Array.isArray(value) ? value.join('\n\n') : value;
      }
    }

    return result;
  }
);

const isoDateFormat = 'YYYY-MM-DDTHH:mm:ssz';

export const dateSerializer: Serializer<Moment> = createSerializer(
  (data: Moment) => data.format(isoDateFormat),
  (data: any) => moment(data, isoDateFormat)
);

export const coordinateSerializer: Serializer<Coordinate> = createSerializer(
  (data: Coordinate) => data.x + ',' + data.y,
  (data: any) => {
    const split = data.split(',');
    if (split.length !== 2) {
      throw new Error('Misformatted coordinate: ' + data);
    }
    return { x: parseInt(split[0], 10), y: parseInt(split[1], 10) };
  }
);

export const stringSerializer = identitySerializer<string>(); // TODO: assert valid values
export const languageSerializer = identitySerializer<Language>(); // TODO: assert valid values

export const booleanSerializer: Serializer<boolean> = createSerializer(
  (data: boolean) => data,
  (data: any) => data || false
);

const mailToUriPrefix = 'mailto:';

export const userLoginSerializer: Serializer<UserLogin> = createSerializer(
  (data: UserLogin) => mailToUriPrefix + data,
  (data: any) => data.substring(mailToUriPrefix.length)
);

export const typeSerializer: Serializer<Type[]> = createSerializer(
  (data: Type[]) => filterDefined(data.map(reverseMapType)),
  (data: any) => filterDefined(normalizeAsArray(data).map(mapType))
);
