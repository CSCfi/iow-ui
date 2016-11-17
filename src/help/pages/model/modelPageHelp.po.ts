import {
  createClickNextCondition, createStory, createNavigatingClickNextCondition,
  createScrollWithDefault, Story
} from '../../contract';
import { child, modelPanelElement } from '../../selectors';
import { KnownModelType, KnownPredicateType } from '../../../entities/type';
import { scrollToTop, classIdFromNamespaceId } from '../../utils';
import gettextCatalog = angular.gettext.gettextCatalog;
import * as SearchClassModal from './modal/searchClassModalHelp.po';
import * as AddPropertiesFromClass from './modal/addPropertiesFromClassModalHelp.po';
import * as ModelView from './modelViewHelp.po';
import * as ClassView from './classViewHelp.po';
import * as ClassForm from './classFormHelp.po';

export function openModelDetails(type: KnownModelType) {

  const openModelDetailsElement = child(ModelView.element, '.model-header');

  return createStory({

    title: `Open ${type} details`,
    content: `Open ${type} details description`,
    scroll: scrollToTop,
    popover: { element: openModelDetailsElement, position: 'bottom-right' },
    focus: { element: openModelDetailsElement },
    nextCondition: createClickNextCondition(openModelDetailsElement)
  });
}

export function openAddResource(type: 'class' | KnownPredicateType) {

  const openAddResourceElement = () => angular.element('button.add-new-button');

  return createStory({
    scroll: createScrollWithDefault(modelPanelElement),
    popover: { element: openAddResourceElement, position: 'right-down' },
    focus: { element: openAddResourceElement },
    title: 'Add ' + type,
    content: 'Add ' + type + " description",
    nextCondition: createClickNextCondition(openAddResourceElement)
  });
}

export function selectClass(namespaceId: string, name: string) {

  const selectClassElement = child(modelPanelElement, `li#${CSS.escape(classIdFromNamespaceId(namespaceId, name))}`);

  return createStory({
    scroll: createScrollWithDefault(modelPanelElement),
    popover: { element: selectClassElement, position: 'right-down' },
    focus: { element: selectClassElement },
    title: 'Select ' + name.toLowerCase(),
    content: 'Select ' + name.toLowerCase() + ' description',
    nextCondition: createNavigatingClickNextCondition(selectClassElement)
  });
}

export function specializeClassItems(klass: { namespaceId: string, name: string, properties: string[] }, gettextCatalog: gettextCatalog): Story[] {
  return [
    openAddResource('class'),
    ...SearchClassModal.findAndSelectExistingClassItems(klass.namespaceId, klass.name, false, gettextCatalog),
    ...AddPropertiesFromClass.selectAndConfirmPropertiesItems('Select name and description', true, klass.properties),
    ClassForm.focusClass(ClassView.element),
    ClassView.saveClassChanges
  ];
}

export function assignClassItems(klass: { namespaceId: string, name: string }, gettextCatalog: gettextCatalog): Story[] {
  return [
    openAddResource('class'),
    ...SearchClassModal.findAndSelectExistingClassItems(klass.namespaceId, klass.name, true, gettextCatalog),
    ClassForm.focusClass(ClassView.element)
  ];
}

export function createNewClassItems(klass: { name: string, comment: string }, gettextCatalog: gettextCatalog): Story[] {
  return [
    openAddResource('class'),
    ...SearchClassModal.findAndCreateNewBasedOnConceptSuggestionItems(klass.name, klass.comment, gettextCatalog),
    ClassForm.focusClass(ClassView.element)
  ];
}
