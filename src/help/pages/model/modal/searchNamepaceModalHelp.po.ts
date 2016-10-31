import { filterForSearchResult, selectSearchResult } from '../../modal/searchModalHelp.po';
import { modal, child } from '../../../selectors';

const searchNamespaceModal = child(modal, '.search-namespace');

export function filterForModel(modelPrefix: string, namespaceId: string, initialSearch: string) {
  return filterForSearchResult(searchNamespaceModal, modelPrefix, namespaceId, initialSearch);
}

export function selectNamespace(modelPrefix: string, namespaceId: string) {
  return selectSearchResult(searchNamespaceModal, modelPrefix, namespaceId, false);
}
