import * as _ from 'lodash';
import { Type, Uri } from './entities';

export function glyphIconClassForType(type: Type): any {
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

export function normalizeAsArray<T>(obj: any): T[] {
  return Array.isArray(obj) ? <T[]> obj : obj ? <T[]> [obj] : <T[]> [];
}

export function collectIds(items: {id: Uri}[]): Set<Uri> {
  return new Set<Uri>(_.map(items, item => item.id));
}
