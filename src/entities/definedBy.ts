import { localizableSerializer, stringSerializer, optional } from './serializer/serializer';
import { Uri } from '../entities/uri';
import { createConstantLocalizable } from '../utils/language';
import { Localizable } from './contract';
import { init } from './mapping';
import { GraphNode } from './graphNode';
import { uriSerializer } from './serializer/entitySerializer';

export class DefinedBy extends GraphNode {

  static definedByMapping = {
    id: { name: '@id', serializer: uriSerializer },
    label: { name: 'label', serializer: localizableSerializer },
    prefix: { name: 'preferredXMLNamespacePrefix', serializer: optional(stringSerializer) }
  };

  id: Uri;
  label: Localizable;
  prefix: string|null;

  constructor(graph: any, context: any, frame: any) {
    super(graph, context, frame);

    if (typeof graph === 'string' || graph instanceof String) {
      const str = (graph instanceof String) ? graph.valueOf() : graph;
      this.id = uriSerializer.deserialize(str, this);
      this.label = createConstantLocalizable(this.id.uri);
      this.prefix = null;
    } else if (typeof graph === 'object') {
      init(this, DefinedBy.definedByMapping);
    } else {
      throw new Error('Unsupported is defined sub-graph');
    }
  }
}
