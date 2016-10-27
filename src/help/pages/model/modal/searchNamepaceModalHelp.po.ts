import { filterForSearchResult, selectSearchResult } from '../../modal/searchModalHelp.po';
import { modal, child } from '../../../selectors';
import { modelIdFromPrefix } from '../../../utils';

const searchNamespaceModal = child(modal, '.search-namespace');

export function filterForModel(modelPrefix: string, initialSearch: string) {
  return filterForSearchResult(searchNamespaceModal, modelPrefix, modelIdFromPrefix(modelPrefix), initialSearch);
}

export function selectNamespace(modelPrefix: string) {
  return selectSearchResult(searchNamespaceModal, modelPrefix, modelIdFromPrefix(modelPrefix), false);
}
