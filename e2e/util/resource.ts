import { lowerCaseFirst, upperCaseFirst } from 'change-case';
import { defaultModelNamespaceForEnvironmentAndPrefix } from '../../config';

export function modelIdFromPrefix(modelPrefix: string) {
  return defaultModelNamespaceForEnvironmentAndPrefix('local', modelPrefix);
}

function normalizeId(id: string) {
  return id
    .replace(/\s/, '')
    .replace(/ö/, 'o')
    .replace(/Ö/, 'O')
    .replace(/ä/, 'a')
    .replace(/Ä/, 'A')
    .replace(/å/, 'a')
    .replace(/Å/, 'A');
}

export function classNameToResourceId(name: string) {
  return normalizeId(upperCaseFirst(name));
}

export function predicateNameToResourceId(name: string) {
  return normalizeId(lowerCaseFirst(name));
}

export function classIdFromNamespaceId(namespaceId: string, name: string) {
  return namespaceId + '#' + classNameToResourceId(name);
}

export function predicateIdFromNamespaceId(namespaceId: string, name: string) {
  return namespaceId + '#' + predicateNameToResourceId(name);
}
