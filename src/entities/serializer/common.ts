import { normalizeAsSingle } from '../../utils/entity';
import { requireDefined } from '../../utils/object';
import { DefinedBy } from '../definedBy';
import { entityAsId, normalized } from './entitySerializer';
import { WithIdAndType } from '../../components/contracts';
import { GraphNode } from '../graphNode';

export const normalizingDefinedBySerializer = normalized<DefinedBy, GraphNode & WithIdAndType>(entityAsId(() => DefinedBy),
  (data, instance) => requireDefined(normalizeAsSingle(data, instance.id)));
