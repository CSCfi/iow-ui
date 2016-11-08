import { lowerCaseFirst, upperCaseFirst } from 'change-case';
import { defaultModelNamespaceForEnvironmentAndPrefix } from '../../config';

export function modelIdFromPrefix(modelPrefix: string) {
  return defaultModelNamespaceForEnvironmentAndPrefix('local', modelPrefix);
}

export function classIdFromNamespaceId(namespaceId: string, name: string) {
  return namespaceId + '#' + upperCaseFirst(name);
}

export function predicateIdFromNamespaceId(namespaceId: string, name: string) {
  return namespaceId + '#' + lowerCaseFirst(name);
}
