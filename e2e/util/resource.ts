import { lowerCaseFirst, upperCaseFirst } from 'change-case';
import { defaultModelNamespaceForEnvironmentAndPrefix } from '../../config';

export function modelIdFromPrefix(modelPrefix: string) {
  return defaultModelNamespaceForEnvironmentAndPrefix('local', modelPrefix);
}

export function classNameToResourceId(name: string) {
  return upperCaseFirst(name.replace(' ', ''));
}

export function predicateNameToResourceId(name: string) {
  return lowerCaseFirst(name.replace(' ', ''));
}

export function classIdFromNamespaceId(namespaceId: string, name: string) {
  return namespaceId + '#' + classNameToResourceId(name);
}

export function predicateIdFromNamespaceId(namespaceId: string, name: string) {
  return namespaceId + '#' + predicateNameToResourceId(name);
}
