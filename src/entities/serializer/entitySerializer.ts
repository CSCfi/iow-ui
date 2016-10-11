import { Uri } from '../../services/uri';
import { GraphNode } from '../graphNode';
import { EntityFactory } from '../contract';
import { isDefined, assertNever } from '../../utils/object';
import { WithIdAndType } from '../../components/contracts';
import { normalizeAsArray } from '../../utils/array';
import { indexById } from '../../utils/entity';

export interface EntityAwareSerializer<T, N> {
  type: 'EntityAware';
  serialize(data: T, clone: boolean): any;
  deserialize(data: any, instance: N): T;
}

export function createEntityAwareSerializer<T, N>(serialize: (data: T, clone: boolean) => any, deserialize: (data: any, instance: N) => T): EntityAwareSerializer<T, N> {
  return {
    type: 'EntityAware',
    serialize,
    deserialize
  };
}

interface WithContext {
  context: any;
}

interface WithContextAndFrame {
  context: any;
  frame: any;
}

export const uriSerializer: EntityAwareSerializer<Uri, WithContext> = createEntityAwareSerializer(
  (data: Uri) => data.toString(),
  (data: any, instance: WithContext) => new Uri(data, instance.context)
);

export function entity<T extends GraphNode, N extends WithContextAndFrame>(entityFactory: EntityFactory<T>): EntityAwareSerializer<T, N> {
  return createEntityAwareSerializer(
    (data: T, clone: boolean) => data.serialize(true, clone),
    (data: any, instance: N) => {
      const constructor = entityFactory(data);
      return new constructor(data, instance.context, instance.frame);
    }
  );
}

export function entityAsId<T extends GraphNode & { id: Uri }, N extends WithContextAndFrame>(entityFactory: EntityFactory<T>): EntityAwareSerializer<T, N> {
  return createEntityAwareSerializer(
    (data: T, clone: boolean) => {
      if (!clone) {
        return data.id.toString();
      } else {
        return data.serialize(true, clone);
      }
    },
    (data: any, instance: N) => {
      const constructor = entityFactory(data);
      return new constructor(data, instance.context, instance.frame);
    }
  );
}

export function entityAwareOptional<T, N extends WithContextAndFrame>(entitySerializer: EntityAwareSerializer<T, N>, isDefinedFn: (data: T|null|undefined) => boolean = isDefined): EntityAwareSerializer<T|null, N> {
  return createEntityAwareSerializer(
    (data: T|null, clone: boolean) => isDefinedFn(data) ? entitySerializer.serialize(data!, clone) : null,
    (data: any, instance: N) => isDefined(data) ? entitySerializer.deserialize(data, instance) : null
  );
}

export function entityAwareValueOrDefault<T, N extends WithContextAndFrame>(entitySerializer: EntityAwareSerializer<T, N>, defaultData: any, isDefinedFn: (data: T|null|undefined) => boolean = isDefined): EntityAwareSerializer<T, N> {
  return createEntityAwareSerializer(
    (data: T, clone: boolean) => isDefinedFn(data) ? entitySerializer.serialize(data!, clone) : null,
    (data: any, instance: N) => entitySerializer.deserialize(isDefined(data) ? data : defaultData, instance)
  );
}

export function entityAwareList<T, N extends WithContextAndFrame>(entitySerializer: EntityAwareSerializer<T, N>): EntityAwareSerializer<T[], N> {
  return createEntityAwareSerializer(
    (data: T[], clone: boolean) => {
      if (data.length === 0) {
        return null;
      } else {
        return data.map(d => entitySerializer.serialize(d, clone));
      }
    },
    (data: any, instance: N) => normalizeAsArray(data).map(d => entitySerializer.deserialize(d, instance))
  );
}

export function entityAwareMap<T extends WithIdAndType, N extends { context: any, frame: any }>(entitySerializer: EntityAwareSerializer<T, N>): EntityAwareSerializer<Map<string, T>, N> {
  return createEntityAwareSerializer(
    (data: Map<string, T>, clone: boolean) => Array.from(data.values()).map(d => entitySerializer.serialize(d, clone)),
    (data: any, instance: N) => indexById(normalizeAsArray(data).map(d => entitySerializer.deserialize(d, instance)))
  );
}

export function entityOrId<T extends GraphNode, N extends { context: any, frame: any }>(entitySerializer: EntityAwareSerializer<T, N>): EntityAwareSerializer<T|Uri, N> {
  return createEntityAwareSerializer(
    (data: T|Uri, clone: boolean) => {
      if (data instanceof GraphNode) {
        return entitySerializer.serialize(data, clone);
      } else if (data instanceof Uri) {
        return uriSerializer.serialize(data, clone);
      } else {
        return assertNever(data, 'Item must be instance of GraphNode or Uri');
      }
    },
    (data: any, instance: N): T|Uri => {
      if (typeof data === 'object') {
        return entitySerializer.deserialize(data, instance);
      } else if (typeof data === 'string') {
        return uriSerializer.deserialize(data, instance);
      } else {
        throw new Error('Incompatible data for entity or id: ' + data);
      }
    }
  );
}

export function normalized<T, N extends { context: any, frame: any }>(entitySerializer: EntityAwareSerializer<T, N>, normalizer: (data: any, instance: N) => any): EntityAwareSerializer<T, N> {
  return createEntityAwareSerializer(
    (data: T, clone: boolean) => entitySerializer.serialize(data, clone),
    (data: any, instance: N) => entitySerializer.deserialize(normalizer(data, instance), instance)
  );
}
