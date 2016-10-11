import { containsAny, collectProperties, index, contains } from './array';
import { WithId } from '../components/contracts';
import { areEqual, requireDefined, isDefined } from './object';
import { IHttpPromiseCallbackArg } from 'angular';
import { Uri, Urn, RelativeUrl } from '../entities/uri';
import { Localizable, Coordinate, Dimensions, GraphData, EntityConstructor } from '../entities/contract';
import { Type } from '../entities/type';
import { DefinedBy } from '../entities/definedBy';
import { Concept, ConceptSuggestion, FintoConcept } from '../entities/vocabulary';
import { Model } from '../entities/model';
import { typeSerializer } from '../entities/serializer/serializer';

export interface Destination {
  id: Uri;
  type: Type[];
  prefix: string|null;
  definedBy: DefinedBy|null;
}


export function modelUrl(prefix: string): RelativeUrl {
  return `/model/${prefix}` + '/';
}

export function resourceUrl(modelPrefix: string, resource: Uri) {
  const resourcePrefix = resource.findPrefix();
  const linked = isDefined(resourcePrefix) && resourcePrefix !== modelPrefix;
  return modelUrl(modelPrefix) +  (linked ? resource.curie : resource.name) + '/';
}

export function contextlessInternalUrl(destination: Destination) {
  if (destination) {
    if (containsAny(destination.type, ['model', 'profile'])) {
      return modelUrl(requireDefined(destination.prefix));
    } else if (containsAny(destination.type, ['group'])) {
      return groupUrl(destination.id.uri);
    } else if (containsAny(destination.type, ['association', 'attribute', 'class', 'shape'])) {
      return resourceUrl(requireDefined(requireDefined(destination.definedBy).prefix), destination.id);
    } else {
      throw new Error('Unsupported type for url: ' + destination.type);
    }
  } else {
    return null;
  }
}

export function groupUrl(id: string): RelativeUrl {
  return `/group?id=${encodeURIComponent(id)}`;
}

export function idToIndexMap<T extends {id: Uri }>(items: T[]): Map<Urn, number> {
  return new Map(items.map<[string, number]>((item: T, index: number) => [item.id.toString(), index]));
}

export function resolveConceptConstructor(graph: any): EntityConstructor<Concept> {
  return isConceptSuggestionGraph(graph) ? ConceptSuggestion : FintoConcept;
}

export function isConceptSuggestionGraph(withType: { '@type': string|string[] }) {
  return contains(typeSerializer.deserialize(withType['@type']), 'conceptSuggestion');
}

export function isLocalizable(obj: any): obj is Localizable {
  return typeof obj === 'object';
}

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
