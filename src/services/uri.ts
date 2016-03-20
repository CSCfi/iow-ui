import { Model } from './entities';

export class Uri {

  constructor(public value: string, private context: any = {}) {
    if (!value) {
      throw new Error("Empty uri");
    }
  }

  isUrn() {
    return this.value.startsWith('urn');
  }

  isUrl() {
    return this.isFullUrl() || this.isCurieUrl();
  }

  get curie() {
    if (this.isUrn()) {
      throw new Error('URN can not be converted to curie: ' + this.value);
    } else if (this.isFullUrl()) {
      const prefix = this.findResolvablePrefix();

      if (prefix) {
        return prefix + ':' + this.name;
      } else {
        throw new Error('Cannot resolve curie: ' + this.value);
      }
    } else if (this.isCurieUrl()) {
      return this.value;
    } else {
      throw new Error('Cannot resolve curie for unknown value: ' + this.value);
    }
  }

  get name() {
    if (this.isUrn()) {
      throw new Error('URN does not have name: ' + this.value);
    } else if (this.isFullUrl()) {
      const namespaceSplit = splitNamespace(this.value);

      if (namespaceSplit) {
        return namespaceSplit.name;
      } else {
        throw new Error('Cannot resolve namespace: ' + this.value);
      }
    } else if (this.isCurieUrl()) {
      return splitCurie(this.value).name;
    } else {
      throw new Error('Cannot resolve namespace for unknown value: ' + this.value);
    }
  }

  get namespaceId() {
    return this.namespace.replace(/[#/]$/, '');
  }

  get namespace() {
    if (this.isUrn()) {
      throw new Error('URN does not have namespace: ' + this.value);
    } else if (this.isFullUrl()) {
      const namespaceSplit = splitNamespace(this.value);

      if (namespaceSplit) {
        return namespaceSplit.namespaceId + (namespaceSplit.separator || '#');
      } else {
        throw new Error('Cannot resolve namespace: ' + this.value);
      }
    } else if (this.isCurieUrl()) {
      const prefix = this.findResolvablePrefix();

      if (prefix) {
        return this.context[prefix];
      } else {
        throw new Error('Namespace does not contain prefix: ' + prefix);
      }
    } else {
      throw new Error('Cannot resolve namespace for unknown value: ' + this.value);
    }
  }

  get compact() {
    return this.hasResolvablePrefix() ? this.curie : this.uri;
  }

  get uri() {
    if (this.hasResolvablePrefix()) {
      return this.namespace + this.name;
    } else {
      return this.value;
    }
  }

  get url() {
    if (this.isUrn()) {
      return null;
    } else {
      return this.uri;
    }
  }

  toString() {
    return this.uri;
  }

  withName(name: string) {
    if (this.isUrn()) {
      throw new Error("Cannot set name for urn: " + this.value);
    } else if (this.isFullUrl()) {
      return new Uri(this.namespace + name, this.context);
    } else if (this.isCurieUrl()) {
      return new Uri(splitCurie(this.value).prefix + ':' + name, this.context);
    } else {
      throw new Error('Cannot set name for unknown value: ' + this.value);
    }
  }

  equals(other: Uri) {
    return other && this.uri === other.uri;
  }

  notEquals(other: Uri) {
    return !this.equals(other);
  }

  hasResolvablePrefix() {
    return !!this.findResolvablePrefix();
  }

  addKnownModelsToContext(model: Model) {
    model.expandContextWithKnownModels(this.context);
  }

  private isFullUrl() {
    return this.value.startsWith('http');
  }

  private isCurieUrl() {
    if (this.isUrn() || this.isFullUrl()) {
      return false;
    }

    const split = splitCurie(this.value);
    return split && !!this.context[split.prefix];
  }

  private findResolvablePrefix() {
    if (this.isUrn()) {
      return null;
    } else if (this.isFullUrl()) {
      const ns = splitNamespace(this.value);

      if (ns) {
        for (const prefix of Object.keys(this.context)) {
          const value = this.context[prefix];
          if (ns && ns.namespaceId + ns.separator === value) {
            return prefix;
          }
        }
      }

      return null;

    } else if (this.isCurieUrl()) {
      const split = splitCurie(this.value);
      return split && !!this.context[split.prefix] && split.prefix;
    } else {
      return null;
    }
  }
}

function splitCurie(curie: string): {prefix: string, name: string} {
  const parts = curie.split(':');
  if (parts.length === 2) {
    return {prefix: parts[0], name: parts[1]};
  }
}

function splitNamespace(id: string): {namespaceId: string, name: string, separator: string} {
  const hashParts = id.split('#');
  if (hashParts.length === 2) {
    return {namespaceId: hashParts[0], name: hashParts[1], separator: '#'};
  } else {
    const lastSlash = id.lastIndexOf('/');
    if (lastSlash) {
      return {namespaceId: id.substr(0, lastSlash), name: id.substr(lastSlash + 1, id.length - 1), separator: '/'};
    } else {
      return null;
    }
  }
}
