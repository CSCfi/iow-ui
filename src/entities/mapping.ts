import { assertNever, isDefined } from '../utils/object';
import { Serializer } from './serializer/serializer';
import { EntityAwareSerializer } from './serializer/entitySerializer';
import { GraphNode } from './graphNode';
import { first, contains } from '../utils/array';

export type Mapping<T, N extends GraphNode> = {
  name: string|string[],
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

  function resolveValue(name: string|string[]): string {
    if (Array.isArray(name)) {
      return first(name.map(n => instance.graph[n]), isDefined);
    } else {
      return instance.graph[name];
    }
  }

  const value = resolveValue(mapping.name);

  switch (mapping.serializer.type) {
    case 'Normal':
      return mapping.serializer.deserialize(value);
    case 'EntityAware':
      return mapping.serializer.deserialize(value, instance);
    default:
      return assertNever(mapping.serializer, 'Unsupported serializer');
  }
}

export function serialize<T, N extends GraphNode>(instance: N, clone: boolean, mappings: { [propertyName: string]: Mapping<any, N>; }, excludeMappings: Mapping<any, any>[] = []) {

  const result: any = {};

  for (const [propertyName, mapping] of Object.entries(mappings)) {
    if (!contains(excludeMappings, mapping)) {
      const propertyExtractor = (i: N) => (i as any)[propertyName] as T;
      serializeSingle<T, N>(result, instance, clone, propertyExtractor, mapping);
    }
  }

  return result;
}

export function serializeSingle<T, N extends GraphNode>(result: any, instance: N, clone: boolean, propertyExtractor: (instance: N) => T, mapping: Mapping<any, N>) {

  if (Array.isArray(mapping.name)) {
    throw new Error('Cannot serialize unambiguous name: ' + mapping.name.join(','));
  }

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
