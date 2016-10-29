import { confirm } from '../../modal/modalHelp.po';
import {
  filterForSearchResult, selectSearchResult, focusSearchSelection,
  textSearchElement, searchResultsElement
} from '../../modal/searchModalHelp.po';
import { modal, child, nth } from '../../../selectors';
import {
  createStory, createExpectedStateNextCondition,
  createClickNextCondition, createScrollWithElement
} from '../../../contract';
import { initialInputValue, inputHasExactValue, predicateIdFromPrefixAndName } from '../../../utils';
import { KnownPredicateType } from '../../../../entities/type';

export const searchPredicateModalElement = child(modal, '.search-predicate');
const searchPredicateModalTextSearchElement = textSearchElement(searchPredicateModalElement);
const searchPredicateResultsElement =  searchResultsElement(searchPredicateModalElement);

export function filterForPredicate(modelPrefix: string, predicateName: string, initialSearch: string) {
  return filterForSearchResult(searchPredicateModalElement, predicateName.toLowerCase(), predicateIdFromPrefixAndName(modelPrefix, predicateName), initialSearch);
}

export function filterForNewPredicate(predicateName: string) {

  return createStory({

    title: `Search for ${predicateName.toLowerCase()}`,
    content: 'Diipadaa',
    popover: {
      element: searchPredicateModalTextSearchElement,
      position: 'bottom-right'
    },
    focus: { element: searchPredicateModalTextSearchElement },
    nextCondition: createExpectedStateNextCondition(inputHasExactValue(searchPredicateModalTextSearchElement, predicateName)),
    initialize: initialInputValue(searchPredicateModalTextSearchElement, predicateName),
    reversible: true
  });
}

export function selectPredicate(modelPrefix: string, predicateName: string) {
  return selectSearchResult(searchPredicateModalElement, predicateName.toLowerCase(), predicateIdFromPrefixAndName(modelPrefix, predicateName), true);
}

export function selectAddNewPredicateSearchResult(type: KnownPredicateType) {

  const selectAddNewPredicateSearchResultElement = nth(child(searchPredicateModalElement, '.search-result.add-new'), type === 'attribute' ? 0 : 1);
  return createStory({
    title: `Select new ${type} creation`,
    content: 'Diipadaa',
    popover: {
      element: selectAddNewPredicateSearchResultElement,
      position: 'bottom-right',
      scroll: createScrollWithElement(searchPredicateResultsElement, 0)
    },
    focus: { element: selectAddNewPredicateSearchResultElement },
    nextCondition: createClickNextCondition(selectAddNewPredicateSearchResultElement)
  });
}

export const focusSelectedAttribute = focusSearchSelection(searchPredicateModalElement, 'Attribute is here', 'Diipadaa');
export const focusSelectedAssociation = focusSearchSelection(searchPredicateModalElement, 'Association is here', 'Diipadaa');

export function confirmPredicateSelection(navigates: boolean) {
 return confirm(searchPredicateModalElement, navigates);
}
