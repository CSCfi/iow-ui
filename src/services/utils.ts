import { Type, Uri, Localizable } from './entities';

interface WithId {
  id: Uri;
}

export function isString(str: any): str is string {
  return typeof str === 'string';
}

export function isNumber(str: any): str is number {
  return typeof str === 'number';
}

export function containsAny<T>(arr: T[], values: T[]): boolean {
  for(const item of arr) {
    for (const value of values) {
      if (item === value) {
        return true;
      }
    }
  }
  return false;
}

export function glyphIconClassForType(type: Type[]) {
  return [
    'glyphicon',
    {
      'glyphicon-list-alt': containsAny(type, ['class', 'shape']),
      'glyphicon-tasks': containsAny(type, ['attribute']),
      'glyphicon-sort': containsAny(type, ['association']),
      'glyphicon-book': containsAny(type, ['model', 'profile']),
      'glyphicon-question-sign': !type || type.length === 0
    }
  ];
}

export function normalizeAsArray<T>(obj: T|T[]): T[] {
  return Array.isArray(obj) ? obj : obj ? [obj] : [];
}

export function collectIds(items: WithId[]|WithId[][]): Set<Uri> {
  return collectProperties<WithId, Uri>(items, item => item.id);
}

export function collectProperties<T, TResult>(items: T[]|T[][], propertyExtractor: (item: T) => TResult): Set<TResult> {
  const result = new Set<TResult>();
  for (const item of items) {
    if (Array.isArray(item)) {
      for (const innerItem of item) {
        result.add(propertyExtractor(innerItem));
      }
    } else {
      result.add(propertyExtractor(item));
    }
  }
  return result;
}

export function splitCurie(curie: string): {prefix: string, value: string} {
  const parts = curie.split(':');
  if (parts.length === 2) {
    return {prefix: parts[0], value: parts[1]};
  }
}

export function splitNamespace(curie: string): {namespace: string, idName: string} {
  const parts = curie.split('#');
  if (parts.length === 2) {
    return {namespace: parts[0] + '#', idName: parts[1]};
  }
}

function normalizeUrl(url: string): string {
  return url.replace(/:/g, '%3A').replace(/&property.*/, '');
}

export function isDifferentUrl(lhs: string, rhs: string): boolean {
  return normalizeUrl(lhs) !== normalizeUrl(rhs);
}

export function normalizeSelectionType(types: Type[]): Type {
  if (containsAny(types, ['class', 'shape'])) {
    return 'class';
  } else if (containsAny(types, ['attribute'])) {
    return 'attribute';
  } else if (containsAny(types, ['association'])) {
    return 'association';
  } else {
    throw new Error('Unsupported selection type: ' + types.join());
  }
}

export function normalizeModelType(types: Type[]): Type {
  if (containsAny(types, ['profile'])) {
    return 'profile';
  } else {
    return 'model';
  }
}

function hasValue(obj: any) {
  for (const value of Object.values(obj)) {
    if (!!value) {
      return true;
    }
  }
  return false;
}

export function hasLocalization(localizable: Localizable) {
  return !!localizable && hasValue(localizable)
}
