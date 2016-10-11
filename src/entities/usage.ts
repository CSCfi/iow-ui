import { EditableEntity, Localizable } from './contract';
import { Uri } from '../services/uri';
import { localizableSerializer, stringSerializer, optional } from './serializer/serializer';
import { DefinedBy } from './definedBy';
import { contextlessInternalUrl } from '../utils/entity';
import { normalizeReferrerType, Type } from './type';
import { init } from './mapping';
import { GraphNode } from './graphNode';
import { uriSerializer, entityAwareOptional, entity, entityAwareList } from './serializer/entitySerializer';

export interface Usage {
  id: Uri;
  label: Localizable;
  referrers: Referrer[];
}

export class DefaultUsage extends GraphNode implements Usage {

  static defaultUsageMappings = {
    id:        { name: '@id',            serializer: uriSerializer },
    label:     { name: 'label',          serializer: localizableSerializer },
    definedBy: { name: 'isDefinedBy',    serializer: entityAwareOptional(entity(() => DefinedBy)) },
    referrers: { name: 'isReferencedBy', serializer:  entityAwareList(entity(() => Referrer))}
  };

  id: Uri;
  label: Localizable;
  definedBy: DefinedBy|null;
  referrers: Referrer[];

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, DefaultUsage.defaultUsageMappings);
  }
}

export class EmptyUsage implements Usage {

  id: Uri;
  label: Localizable;
  referrers: Referrer[] = [];

  constructor(entity: EditableEntity) {
    this.id = entity.id;
    this.label = entity.label;
  }
}

export class Referrer extends GraphNode {

  static referrerMappings = {
    id:        { name: '@id',                         serializer: uriSerializer },
    label:     { name: 'label',                       serializer: localizableSerializer },
    prefix:    { name: 'preferredXMLNamespacePrefix', serializer: optional(stringSerializer) },
    definedBy: { name: 'isDefinedBy',                 serializer: entityAwareOptional(entity(() => DefinedBy)) }

  };

  id: Uri;
  label: Localizable;
  prefix: string|null;
  definedBy: DefinedBy|null;
  normalizedType: Type|null;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);
    init(this, Referrer.referrerMappings);
    this.normalizedType = normalizeReferrerType(this.type);
  }

  iowUrl() {
    return contextlessInternalUrl(this);
  }
}
