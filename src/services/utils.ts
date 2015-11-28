import * as _ from 'lodash';
import { Type, Uri } from './entities';

export function isString(str: any): str is string {
  return typeof str === 'string';
}

export function glyphIconClassForType(type: Type) {
  return [
    'glyphicon',
    {
      'glyphicon-list-alt': type === 'class',
      'glyphicon-tasks': type === 'attribute',
      'glyphicon-sort': type === 'association',
      'glyphicon-book': type === 'model',
      'glyphicon-question-sign': !type
    }
  ];
}

export function normalizeAsArray<T>(obj: T|T[]): T[] {
  return Array.isArray(obj) ? obj : obj ? [obj] : [];
}

export function collectIds(items: {id: Uri}[]): Set<Uri> {
  return new Set<Uri>(_.map(items, item => item.id));
}
