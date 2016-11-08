import { v4 as uuid } from 'node-uuid';
import { isDefined } from '../utils/object';
const URI = require('uri-js');

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
    } else if (this.isCurieUrl()) {
      return this.value;
    } else {
      const prefix = this.findResolvablePrefix();

      if (prefix) {
        return prefix + ':' + this.name;
      } else {
        throw new Error('Cannot resolve curie: ' + this.value);
      }
    }
  }

  get name() {
    if (this.isUrn()) {
      throw new Error('URN does not have name: ' + this.value);
    } else if (this.isCurieUrl()) {
      return splitCurie(this.value)!.name;
    } else {
      const namespaceSplit = splitNamespace(this.value);

      if (namespaceSplit) {
        return namespaceSplit.name;
      } else {
        throw new Error('Cannot resolve namespace: ' + this.value);
      }
    }
  }

  get namespaceId() {
    return this.namespace.replace(/[#/]$/, '');
  }

  get namespace() {
    if (this.isUrn()) {
      throw new Error('URN does not have namespace: ' + this.value);
    } else if (this.isCurieUrl()) {
      const prefix = this.findResolvablePrefix();

      if (prefix) {
        return this.context[prefix];
      } else {
        throw new Error('Namespace does not contain prefix: ' + prefix);
      }
    } else {
      const namespaceSplit = splitNamespace(this.value);

      if (namespaceSplit) {
        return namespaceSplit.namespaceId + namespaceSplit.separator;
      } else {
        throw new Error('Cannot resolve namespace: ' + this.value);
      }
    }
  }

  get compact() {
    return this.namespaceResolves() || this.isCurieUrl() ? this.curie : this.uri;
  }

  get uri() {
    if (this.namespaceResolves()) {
      return this.namespace + this.name;
    } else if (!this.isCurieUrl()) {
      return this.value;
    } else {
      throw new Error('Curie cannot be resolved as URI: ' + this.value);
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
      throw new Error("Cannot set name for urn: " + this.value);
    } else if (this.isCurieUrl()) {
      return new Uri(splitCurie(this.value)!.prefix + ':' + name, this.context);
    } else {
      return new Uri(this.namespace + name, this.context);
    }
  }

  equals(other: Uri|null) {
    return !!other && this.uri === other.uri;
  }

  notEquals(other: Uri) {
    return !this.equals(other);
  }

  namespaceResolves() {
    return !!this.findResolvablePrefix();
  }

  isCurieUrl() {
    const parsed = URI.parse(this.value);
    return !this.isUrn() && !parsed.port && /\w+:\w+/.test(this.value);
  }

  findPrefix() {
    if (this.isUrn()) {
      return null;
    } else if (this.isCurieUrl()) {
      const split = splitCurie(this.value);
      return split && split.prefix;
    } else {

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
    }
  }

  findResolvablePrefix() {
    const prefix = this.findPrefix();
    if (isDefined(prefix) && isDefined(this.context[prefix])) {
      return prefix;
    } else {
      return null;
    }
  }
}

function splitCurie(curie: string): {prefix: string, name: string}|null {
  const parts = curie.split(':');
  if (parts.length === 2) {
    return {prefix: parts[0], name: parts[1]};
  } else {
    return null;
  }
}

function splitNamespace(id: string): {namespaceId: string, name: string, separator: string}|null {
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
