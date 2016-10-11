import { requireDefined } from '../../utils/object';
import { DefinedBy } from '../definedBy';
import { entityAsId, normalized } from './entitySerializer';
import { WithIdAndType } from '../../components/contracts';
import { GraphNode } from '../graphNode';
import { Uri } from '../uri';

export const normalizingDefinedBySerializer = normalized<DefinedBy, GraphNode & WithIdAndType>(
  entityAsId(() => DefinedBy),
  (data, instance) => requireDefined(normalizeAsSingle(data, instance.id))
);

function normalizeAsSingle(graph: any, parentId: Uri): string|{} {

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
