import { GraphData, Model, Type, Coordinate, Dimensions } from '../services/entities';
import { containsAny, collectProperties, index } from './array';
import { WithId } from '../components/contracts';
import { areEqual } from './object';
import { IHttpPromiseCallbackArg } from 'angular';
import { Uri } from '../services/uri';

export function normalizeAsSingle(graph: any, parentId: Uri): string|{} {

  if (Array.isArray(graph) && graph.length > 0) {

    const parentUri = parentId.uri;
    const ids = graph.map(item => typeof item === 'object' ? item['@id'] : item);

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];

      if (parentUri.startsWith(id)) {
        return graph[i];
      }
    }

    return graph[0];

  } else {
    return graph;
  }
}

export function coordinatesAreEqual(l: Coordinate|null|undefined, r: Coordinate|null|undefined) {
  // Coordinates seem to fluctuate a bit with jointjs and firefox so normalize by truncating decimals
  return areEqual(l, r, (lhs, rhs) => Math.trunc(lhs.x) === Math.trunc(rhs.x) && Math.trunc(lhs.y) === Math.trunc(rhs.y));
}

export function centerToPosition(center: Coordinate, dimensions: Dimensions): Coordinate {
  return { x: center.x - (dimensions.width / 2), y: center.y - (dimensions.height / 2) };
}

export function copyCoordinate(coordinate: Coordinate|null) {
  return coordinate ? { x: coordinate.x, y: coordinate.y } : null;
}

export function copyVertices(vertices: Coordinate[]) {
  return vertices.slice();
}

export function indexById<T extends WithId>(items: T[]): Map<string, T> {
  return index<T, string>(items, item => item.id.toString());
}

export function collectIds(items: WithId[]|WithId[][]): Set<string> {
  return collectProperties<WithId, string>(items, item => {
    return item.id.toString();
  });
}

export function expandContextWithKnownModels(model?: Model): (response: IHttpPromiseCallbackArg<GraphData>) => IHttpPromiseCallbackArg<GraphData> {
  return (response: IHttpPromiseCallbackArg<GraphData>) => {
    if (model) {
      model.expandContextWithKnownModels(response.data!['@context']);
    }
    return response;
  };
}

export function glyphIconClassForType(type: Type[]) {

  if (containsAny(type, ['class', 'shape'])) {
    return ['glyphicon', 'glyphicon-list-alt'];
  } else if (containsAny(type, ['attribute'])) {
    return ['glyphicon', 'glyphicon-tasks'];
  } else if (containsAny(type, ['association'])) {
    return ['glyphicon', 'glyphicon-sort'];
  } else if (containsAny(type, ['model', 'profile'])) {
    return ['glyphicon', 'glyphicon-book'];
  } else if (containsAny(type, ['concept', 'conceptSuggestion'])) {
    return ['fa', 'fa-lightbulb-o'];
  } else if (!type || type.length === 0 || (type.length === 1 && containsAny(type, ['property']))) {
    return ['glyphicon', 'glyphicon-question-sign'];
  } else {
    return [];
  }
}

export const glyphIconClassUnknown = ['glyphicon', 'glyphicon-question-sign'];
