import { filterForSearchResult, selectSearchResult } from '../../modal/searchModalHelp.po';

function modelIdFromPrefix(modelPrefix: string) {
  return `http://iow.csc.fi/ns/${modelPrefix}`;
}

export function filterForModel(modelPrefix: string, initialSearch: string) {
  return filterForSearchResult(modelPrefix, modelIdFromPrefix(modelPrefix), initialSearch);
}

export function selectNamespace(modelPrefix: string) {
  return selectSearchResult(modelPrefix, modelIdFromPrefix(modelPrefix), false);
}
