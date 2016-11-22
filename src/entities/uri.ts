import { v4 as uuid } from 'node-uuid';
import { isDefined } from '../utils/object';

export type Url = string;
export type Urn = string;
export type RelativeUrl = string;

const urnPrefix = 'urn:';
const uuidUrnPrefix = urnPrefix + 'uuid:';

export class Uri {

  constructor(private value: string, private context: any) {
    if (!value) {
      throw new Error('Empty uri');
    }
    if (!context) {
      throw new Error('Context not defined');
    }
    if (typeof value !== 'string') {
      console.log(value);
      throw new Error('Uri value must be string: ' + value);
    }
  }

  static fromUUID(uuid: string) {
    return new Uri(uuidUrnPrefix + uuid, {});
  }

  static randomUUID() {
    return new Uri(uuidUrnPrefix + uuid(), {});
  }

  get uuid() {
    if (this.isUuid()) {
      return this.value.substr(uuidUrnPrefix.length, this.value.length);
    } else {
      throw new Error('Uri is not an uuid urn: ' + this.value);
    }
  }

  isUuid() {
    return this.value.startsWith(uuidUrnPrefix);
  }

  isUrn() {
    return this.value.startsWith(urnPrefix);
  }

  isUrl() {
    return !this.isUrn();
  }

  get curie() {
    if (this.isUrn()) {
      throw new Error('URN can not be converted to curie: ' + this.value);
    } else {

      const resolved = this.resolve();

      if (resolved) {
        return formatCurie(resolved);
      } else {
        throw new Error('Cannot resolve curie: ' + this.value);
      }
    }
  }

  get name() {
    if (this.isUrn()) {
      throw new Error('URN does not have name: ' + this.value);
    } else {

      const resolved = this.resolve();

      if (resolved) {
        return resolved.name;
      }

      const nonResolvingNamespaceSplit = splitNamespace(this.value);

      if (nonResolvingNamespaceSplit) {
        return nonResolvingNamespaceSplit.name;
      }

      throw new Error('Cannot resolve namespace: ' + this.value);
    }
  }

  get namespaceId() {
    return this.namespace.replace(/[#/]$/, '');
  }

  get namespace() {
    if (this.isUrn()) {
      throw new Error('URN does not have namespace: ' + this.value);
    } else {

      const resolved = this.resolve();

      if (resolved) {
        return this.context[resolved.prefix];
      }

      const nonResolvingNamespaceSplit = splitNamespace(this.value);

      if (nonResolvingNamespaceSplit) {
        return nonResolvingNamespaceSplit.namespaceId + nonResolvingNamespaceSplit.separator;
      }

      throw new Error('Cannot resolve namespace: ' + this.value);
    }
  }

  get compact() {

    const resolved = this.resolve();

    if (resolved) {
      return formatCurie(resolved);
    } else {
      return this.value;
    }
  }

  get uri() {

    const resolved = this.resolve();

    if (resolved) {
      return this.context[resolved.prefix] + resolved.name;
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

  get urn() {
    if (this.isUrn()) {
      return this.value;
    } else {
      return null;
    }
  }

  toString() {
    return this.uri;
  }

  withName(name: string) {
    if (this.isUrn()) {
      throw new Error('Cannot set name for urn: ' + this.value);
    } else {
      const resolved = this.resolve();

      if (resolved) {
        return new Uri(formatCurie({ prefix: resolved.prefix, name }), this.context);
      }

      const nonResolvingNamespaceSplit = splitNamespace(this.value);

      if (nonResolvingNamespaceSplit) {
        return new Uri(nonResolvingNamespaceSplit.namespaceId + nonResolvingNamespaceSplit.separator + name, this.context);
      }

      throw new Error('Uri does not resolve: ' + this.value);
    }
  }

  equals(other: Uri|null) {
    return !!other && this.uri === other.uri;
  }

  notEquals(other: Uri) {
    return !this.equals(other);
  }

  resolve(): { prefix: string, name: string } | null {
    if (this.isUrn()) {
      return null;
    } else {
      const split = splitCurie(this.value);

      if (split && this.context[split.prefix]) {
        return split;
      }

      const ns = splitNamespace(this.value);

      if (ns) {
        for (const prefix of Object.keys(this.context)) {
          const value = this.context[prefix];
          if (ns && ns.namespaceId + ns.separator === value) {
            return { prefix, name: ns.name };
          }
        }
      }

      return null;
    }
  }

  resolves(): boolean {
    return isDefined(this.resolve());
  }
}

function formatCurie(resolved: { prefix: string, name: string }) {
  return resolved.prefix + ':' + resolved.name;
}

function splitCurie(curie: string): { prefix: string, name: string } | null {

  const parts = curie.split(':');

  if (parts.length === 2) {
    return {prefix: parts[0], name: parts[1]};
  } else {
    return null;
  }
}

function splitNamespace(id: string): { namespaceId: string, name: string, separator: string } | null {

  const hashParts = id.split('#');

  if (hashParts.length === 2) {
    return { namespaceId: hashParts[0], name: hashParts[1], separator: '#' };
  } else {
    const lastSlash = id.lastIndexOf('/');
    if (lastSlash !== -1) {
      return { namespaceId: id.substr(0, lastSlash), name: id.substr(lastSlash + 1, id.length - 1), separator: '/' };
    } else {
      return null;
    }
  }
}
