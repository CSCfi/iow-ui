import * as _ from 'lodash';
import { Type, Uri } from './entities';

interface WithId {
  id: Uri;
}

export function isString(str: any): str is string {
  return typeof str === 'string';
}

export function isNumber(str: any): str is number {
  return typeof str === 'number';
}

export function glyphIconClassForType(type: Type) {
  return [
    'glyphicon',
    {
      'glyphicon-list-alt': type === 'class' || type === 'shape',
      'glyphicon-tasks': type === 'attribute',
      'glyphicon-sort': type === 'association',
      'glyphicon-book': type === 'model' || type === 'profile',
      'glyphicon-question-sign': !type
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

function normalizeUrl(url: string): string {
  return url.replace(/:/g, '%3A').replace(/&property.*/, '');
}

export function isDifferentUrl(lhs: string, rhs: string): boolean {
  return normalizeUrl(lhs) !== normalizeUrl(rhs);
}

export function normalizeSelectionType(type: Type) {
  if (type === 'class' || type === 'shape') {
    return 'class';
  } else if (type === 'attribute' || type == 'association') {
    return type;
  } else {
    throw new Error('Unsupported selection type: ' + type);
  }
}
