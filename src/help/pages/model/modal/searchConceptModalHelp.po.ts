import { confirm } from '../../modal/modalHelp.po';
import { modal, child, editableByTitle, input, editableFocus } from '../../../selectors';
import { createStory, createExpectedStateNextCondition, Story } from '../../../contract';
import {
  initialInputValue, validInput,
  editableSelectMargin, editableMargin
} from '../../../utils';
import {
  filterForAddNewResult, selectAddNewResult, selectSearchResult,
  focusSearchSelection, filterForSearchResult
} from '../../modal/searchModalHelp.po';
import gettextCatalog = angular.gettext.gettextCatalog;

const searchConceptModal = child(modal, '.search-concept');

export function filterForConceptSuggestionConcept(conceptName: string, gettextCatalog: gettextCatalog) {
  return filterForAddNewResult(searchConceptModal, conceptName, gettextCatalog, "concept");
}

export function filterForConcept(className: string, conceptId: string, gettextCatalog: gettextCatalog) {
  return filterForSearchResult(searchConceptModal, className, conceptId, gettextCatalog);
}

export const addConceptSuggestionSearchResult = selectAddNewResult(searchConceptModal, 0, 'Select concept suggest creation');

export function selectConcept(conceptId: string, conceptName: string) {
  return selectSearchResult(searchConceptModal, conceptName, conceptId, true);
}

export const focusSelectedConcept = focusSearchSelection(searchConceptModal, 'Concept is here', 'Concept is here info');

const enterVocabularyElement = editableByTitle(modal, 'Vocabulary');
const enterVocabularyInputElement = input(enterVocabularyElement);
export const enterVocabulary = createStory({

  title: 'Vocabulary',
  content: 'Select the vocabulary that is missing the required concept',
  popover: { element: enterVocabularyInputElement, position: 'left-down' },
  focus: { element: editableFocus(enterVocabularyElement), margin: editableSelectMargin },
  nextCondition: createExpectedStateNextCondition(validInput(enterVocabularyInputElement)),
  reversible: true
});

const enterLabelElement = editableByTitle(modal, 'Concept label');
const enterLabelInputElement = input(enterLabelElement);
export const enterLabel = createStory({

  title: 'Concept label',
  content: 'Concept label info',
  popover: { element: enterLabelInputElement, position: 'left-down' },
  focus: { element: editableFocus(enterLabelElement), margin: editableMargin },
  nextCondition: createExpectedStateNextCondition(validInput(enterLabelInputElement)),
  reversible: true
});

export function enterDefinition(initialValue: string, gettextCatalog: gettextCatalog) {

  const enterDefinitionElement = editableByTitle(modal, 'Definition');
  const enterDefinitionInputElement = input(enterDefinitionElement);

  return createStory({

    title: 'Definition',
    content: 'Suggest definition or description for the concept',
    popover: { element: enterDefinitionInputElement, position: 'left-down' },
    focus: { element: editableFocus(enterDefinitionElement), margin: editableMargin },
    nextCondition: createExpectedStateNextCondition(validInput(enterDefinitionInputElement)),
    initialize: initialInputValue(enterDefinitionInputElement, gettextCatalog.getString(initialValue)),
    reversible: true
  });
}

export function confirmConceptSelection(navigates: boolean) {
  return confirm(searchConceptModal, navigates);
}

export function findAndCreateNewSuggestionItems(name: string, definition: string, navigates: boolean, gettextCatalog: gettextCatalog): Story[] {
  return [
    filterForConceptSuggestionConcept(name, gettextCatalog),
    addConceptSuggestionSearchResult,
    enterVocabulary,
    enterLabel,
    enterDefinition(definition, gettextCatalog),
    confirmConceptSelection(navigates)
  ];
}

export function findAndSelectExistingConceptItems(name: string, conceptId: string, navigates: boolean, gettextCatalog: gettextCatalog): Story[] {
  return [
    filterForConcept(name, conceptId, gettextCatalog),
    selectConcept(conceptId, name),
    focusSelectedConcept,
    confirmConceptSelection(navigates)
  ];
}
