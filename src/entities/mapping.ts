import { assertNever } from '../utils/object';
import { Serializer } from './serializer/serializer';
import { EntityAwareSerializer } from './serializer/entitySerializer';
import { GraphNode } from './graphNode';

export type Mapping<T, N extends GraphNode> = {
  name: string,
  serializer: Serializer<T>|EntityAwareSerializer<T, N>,
};

export function init<T, N extends GraphNode>(instance: N, mappings: { [propertyName: string]: Mapping<any, N>; }) {
  const result: any = {};

  for (const [propertyName, mapping] of Object.entries(mappings)) {
    (instance as any)[propertyName] = initSingle<T, N>(instance, mapping);
  }

  return result;
}

export function initSingle<T, N extends GraphNode>(instance: N, mapping: Mapping<T, N>) {

  const value = instance.graph[mapping.name];

  switch (mapping.serializer.type) {
    case 'Normal':
      return mapping.serializer.deserialize(value);
    case 'EntityAware':
      return mapping.serializer.deserialize(value, instance);
    default:
      return assertNever(mapping.serializer, 'Unsupported serializer');
  }
}

export function serialize<T, N extends GraphNode>(instance: N, clone: boolean, mappings: { [propertyName: string]: Mapping<any, N>; }) {

  const result: any = {};

  for (const [propertyName, mapping] of Object.entries(mappings)) {
    const propertyExtractor = (i: N) => (i as any)[propertyName] as T;
    serializeSingle<T, N>(result, instance, clone, propertyExtractor, mapping);
  }

  return result;
}

export function serializeSingle<T, N extends GraphNode>(result: any, instance: N, clone: boolean, propertyExtractor: (instance: N) => T, mapping: Mapping<any, N>) {

  const value: T = propertyExtractor(instance);

  switch (mapping.serializer.type) {
    case 'Normal':
      result[mapping.name] = mapping.serializer.serialize(value);
      break;
    case 'EntityAware':
      result[mapping.name] = mapping.serializer.serialize(value, clone);
      break;
    default:
      assertNever(mapping.serializer, 'Unsupported serializer');
  }
}
