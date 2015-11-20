import * as _  from 'lodash';
import { Require, Uri } from './entities';

export class ModelCache {
  private requires: Require[];

  updateRequires(updatedRequires: Require[]) {
    this.requires = updatedRequires;
  }

  modelIdForNamespace(namespace: Uri): Uri {
    const require = _.find(this.requires, req => req.namespace === namespace);
    return require && require.id;
  }
}

