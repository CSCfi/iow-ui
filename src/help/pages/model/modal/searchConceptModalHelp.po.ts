import { confirm } from '../../modal/modalHelp.po';
import { modal, child, first, editableByTitle, input, editableFocus } from '../../../selectors';
import {
  createStory, createExpectedStateNextCondition,
  createClickNextCondition, createScrollWithElement
} from '../../../contract';
import {
  initialInputValue, inputHasExactValue, validInput,
  editableSelectMargin, editableMargin
} from '../../../utils';
import { searchResultsElement } from '../../modal/searchModalHelp.po';

const searchConceptModal = child(modal, '.search-concept');
const conceptTextSearchElement = child(searchConceptModal, 'text-filter input');
const searchConceptResultsElement = searchResultsElement(searchConceptModal);

export function filterForConceptSuggestionConcept(conceptName: string) {
  return createStory({

    title: `Search for ${conceptName.toLowerCase()}`,
    content: 'Diipadaa',
    popover: { element: conceptTextSearchElement, position: 'bottom-right' },
    focus: { element: conceptTextSearchElement },
    nextCondition: createExpectedStateNextCondition(inputHasExactValue(conceptTextSearchElement, conceptName)),
    initialize: initialInputValue(conceptTextSearchElement, conceptName)
  });
}

const addConceptSuggestionSearchResultElement = first(child(searchConceptResultsElement, '.search-result.add-new'));
export const addConceptSuggestionSearchResult = createStory({
  title: 'Select concept suggest creation',
  content: 'Diipadaa',
  scroll: createScrollWithElement(searchConceptResultsElement, addConceptSuggestionSearchResultElement),
  popover: { element: addConceptSuggestionSearchResultElement, position: 'bottom-right' },
  focus: { element: addConceptSuggestionSearchResultElement },
  nextCondition: createClickNextCondition(addConceptSuggestionSearchResultElement)
});

const enterVocabularyElement = editableByTitle(modal, 'Vocabulary');
const enterVocabularyInputElement = input(enterVocabularyElement);
export const enterVocabulary = createStory({

  title: 'Vocabulary',
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

export function enterDefinition(initialValue: string) {

  const enterDefinitionElement = editableByTitle(modal, 'Definition');
  const enterDefinitionInputElement = input(enterDefinitionElement);

  return createStory({

    title: 'Definition',
    content: 'Definition info',
    popover: { element: enterDefinitionInputElement, position: 'left-down' },
    focus: { element: editableFocus(enterDefinitionElement), margin: editableMargin },
    nextCondition: createExpectedStateNextCondition(validInput(enterDefinitionInputElement)),
    initialize: initialInputValue(enterDefinitionInputElement, initialValue),
    reversible: true
  });
}

export function confirmConceptSelection(navigates: boolean) {
  return confirm(searchConceptModal, navigates);
}
