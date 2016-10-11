import { glyphIconClassForType } from '../utils/entity';
import { containsAny } from '../utils/array';
import { Type } from './type';
import { init } from './mapping';
import { typeSerializer } from './serializer/serializer';

export abstract class GraphNode {

  static graphNodeMappings = {
    type: { name: '@type', serializer: typeSerializer }
  };

  type: Type[];

  constructor(public graph: any, public context: any, public frame: any) {
    init(this, GraphNode.graphNodeMappings);
  }

  isOfType(type: Type) {
    return containsAny(this.type, [type]);
  }

  get glyphIconClass(): any {
    return glyphIconClassForType(this.type);
  }

  serializationValues(_inline: boolean, _clone: boolean): {} {
    return {};
  }

  serialize(inline: boolean = false, clone: boolean = false): any {
    const values = Object.assign(this.graph, this.serializationValues(inline, clone));

    for (const [key, value] of Object.entries(values)) {
      if (value === null) {
        delete values[key];
      }
    }

    if (inline) {
      return values;
    } else {
      return {
        '@graph': values,
        '@context': this.context
      };
    }
  }
}

export abstract class GraphNodes<T extends GraphNode> {

  constructor(public context: any, public frame: any) {
  }

  abstract getNodes(): T[];

  serialize(inline: boolean = false, clone: boolean = false): any {

    const values = this.getNodes().map(node => node.serialize(true, clone));

    if (inline) {
      return values;
    } else {
      return {
        '@graph': values,
        '@context': this.context
      };
    }
  }
}
