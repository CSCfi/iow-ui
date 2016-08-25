import { GraphData, Model, Type } from '../services/entities';
import { containsAny, collectProperties, index } from './array';
import { WithId } from '../components/contracts';

export function indexById<T extends WithId>(items: T[]): Map<string, T> {
  return index<T, string>(items, item => item.id.toString());
}

export function collectIds(items: WithId[]|WithId[][]): Set<string> {
  return collectProperties<WithId, string>(items, item => {
    return item.id.toString();
  });
}

export function expandContextWithKnownModels(model?: Model): (response: angular.IHttpPromiseCallbackArg<GraphData>) => angular.IHttpPromiseCallbackArg<GraphData> {
  return (response: angular.IHttpPromiseCallbackArg<GraphData>) => {
    if (model) {
      model.expandContextWithKnownModels(response.data['@context']);
    }
    return response;
  };
}

export function glyphIconClassForType(type: Type[]) {
  return [
    'glyphicon',
    {
      'glyphicon-list-alt': containsAny(type, ['class', 'shape']),
      'glyphicon-tasks': containsAny(type, ['attribute']),
      'glyphicon-sort': containsAny(type, ['association']),
      'glyphicon-book': containsAny(type, ['model', 'profile']),
      'glyphicon-question-sign': !type || type.length === 0 || (type.length === 1 && containsAny(type, ['property']))
    }
  ];
}
