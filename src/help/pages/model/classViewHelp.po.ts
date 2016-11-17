import { child } from '../../selectors';
import {
  createStory, createModifyingClickNextCondition,
  createClickNextCondition, createScrollWithDefault, createScrollNone, Story
} from '../../contract';
import * as ClassForm from './classFormHelp.po';
import * as SearchPredicateModal from './modal/searchPredicateModalHelp.po';
import { KnownPredicateType } from '../../../entities/type';
import gettextCatalog = angular.gettext.gettextCatalog;

export const element = () => angular.element('class-view');

const modifyClassElement = child(element, 'button.edit');
export const modifyClass = createStory({

  title: 'Modify class',
  content: 'Classes can be modified',
  scroll: createScrollWithDefault(element),
  popover: { element: modifyClassElement, position: 'left-down' },
  focus: { element: modifyClassElement },
  nextCondition: createModifyingClickNextCondition(modifyClassElement)
});

const saveClassChangesElement = child(element, 'button.save');
export const saveClassChanges = createStory({

  title: 'Save changes',
  content: 'Changes need to be saved',
  scroll: createScrollNone(),
  popover: { element: saveClassChangesElement, position: 'left-down' },
  focus: { element: saveClassChangesElement },
  nextCondition: createModifyingClickNextCondition(saveClassChangesElement)
});

const addPropertyElement = child(element, 'button.add-property');
export const addProperty = createStory({
  title: 'Add property',
  content: 'You can add new attribute or association to the Class from here',
  scroll: createScrollNone(),
  popover: { element: addPropertyElement, position: 'left-down' },
  focus: { element: addPropertyElement },
  nextCondition: createClickNextCondition(addPropertyElement)
});

export function addPropertyUsingExistingPredicateItems(predicate: { type: KnownPredicateType, namespaceId: string, name: string }, gettextCatalog: gettextCatalog): Story[] {
  return [
    addProperty,
    ...SearchPredicateModal.findAndSelectExistingPredicateItems(predicate.type, predicate.namespaceId, predicate.name, gettextCatalog),
    ClassForm.focusOpenProperty(element)
  ];
}

export function addPropertyBasedOnSuggestionItems(predicate: { type: KnownPredicateType, searchName: string, name: string, comment: string }, gettextCatalog: gettextCatalog): Story[] {
  return [
    addProperty,
    ...SearchPredicateModal.findAndCreateNewPropertyBasedOnSuggestionItems(predicate.type, predicate.searchName, predicate.name, predicate.comment, gettextCatalog),
    ClassForm.focusOpenProperty(element)
  ];
}

export function addPropertyBasedOnExistingConceptItems(predicate: { type: KnownPredicateType, searchName: string, name: string, conceptId: string }, gettextCatalog: gettextCatalog): Story[] {
  return [
    addProperty,
    ...SearchPredicateModal.findAndCreateNewPropertyBasedOnExistingConceptItems(predicate.type, predicate.searchName, predicate.name, predicate.conceptId, gettextCatalog),
    ClassForm.focusOpenProperty(element)
  ];
}
