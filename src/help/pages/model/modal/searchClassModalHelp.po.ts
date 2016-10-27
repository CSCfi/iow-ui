import { confirm } from '../../modal/modalHelp.po';
import { filterForSearchResult, selectSearchResult } from '../../modal/searchModalHelp.po';
import { modal, child } from '../../../selectors';

function resourceIdFromPrefixAndName(modelPrefix: string, name: string) {
  return `http://iow.csc.fi/ns/${modelPrefix}#${name}`;
}

export function filterForClass(modelPrefix: string, className: string, initialSearch: string) {
  return filterForSearchResult(className.toLowerCase(), resourceIdFromPrefixAndName(modelPrefix, className), initialSearch);
}

export function selectClass(modelPrefix: string, className: string) {
  return selectSearchResult(className.toLowerCase(), resourceIdFromPrefixAndName(modelPrefix, className), true);
}

export const confirmClassSelection = confirm(child(modal, '.search-class'), false);
