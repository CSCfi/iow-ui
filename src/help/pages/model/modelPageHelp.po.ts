import {
  createClickNextCondition, createStory, createNavigatingClickNextCondition,
  createScrollWithDefault, Story
} from '../../contract';
import { modelView, child, modelPanelElement, classView } from '../../selectors';
import { KnownModelType, KnownPredicateType } from '../../../entities/type';
import { scrollToTop, classIdFromNamespaceId } from '../../utils';
import gettextCatalog = angular.gettext.gettextCatalog;
import { exampleImportedLibrary } from '../../entities';
import * as SearchNamespaceModal from './modal/searchNamepaceModalHelp.po';
import * as SearchClassModal from './modal/searchClassModalHelp.po';
import * as SearchPredicateModal from './modal/searchPredicateModalHelp.po';
import * as AddPropertiesFromClass from './modal/addPropertiesFromClassModalHelp.po';
import * as ModelView from './modelViewHelp.po';
import * as ClassView from './classViewHelp.po';
import * as SearchConceptModal from './modal/searchConceptModalHelp.po';
import * as PredicateForm from './predicateFormHelp.po';
import * as ClassForm from './classFormHelp.po';
import * as VisualizationView from './visualizationViewHelp.po';

export function openModelDetails(type: KnownModelType) {

  const openModelDetailsElement = child(modelView, '.model-header');

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


export function addNamespaceItems(gettextCatalog: gettextCatalog): Story[] {
  return [
    ModelView.requireNamespace,
    SearchNamespaceModal.filterForModel(exampleImportedLibrary.prefix, exampleImportedLibrary.namespaceId, gettextCatalog),
    SearchNamespaceModal.selectNamespace(exampleImportedLibrary.prefix, exampleImportedLibrary.namespaceId),
    ModelView.focusNamespaces
  ];
}

export function specializeClassItems(namespaceId: string, className: string, selectProperties: string[], gettextCatalog: gettextCatalog): Story[] {
  return [
    openAddResource('class'),
    SearchClassModal.filterForClass(namespaceId, className, gettextCatalog),
    SearchClassModal.selectClass(namespaceId, className),
    SearchClassModal.focusSelectedClass,
    SearchClassModal.confirmClassSelection(false),
    AddPropertiesFromClass.selectProperties('Select name and description', selectProperties),
    AddPropertiesFromClass.confirmProperties(true),
    ClassForm.focusClass(classView),
    ClassView.saveClassChanges
  ];
}

export function assignClassItems(namespaceId: string, className: string, gettextCatalog: gettextCatalog): Story[] {
  return [
    openAddResource('class'),
    SearchClassModal.filterForClass(namespaceId, className, gettextCatalog),
    SearchClassModal.selectClass(namespaceId, className),
    SearchClassModal.focusSelectedClass,
    SearchClassModal.confirmClassSelection(true),
    ClassForm.focusClass(classView)
  ];
}

export function addAttributeItems(namespaceId: string, attributeName: string, gettextCatalog: gettextCatalog): Story[] {
  return [
    ClassView.addProperty,
    SearchPredicateModal.filterForPredicate(namespaceId, attributeName, gettextCatalog),
    SearchPredicateModal.selectPredicate(namespaceId, attributeName),
    SearchPredicateModal.focusSelectedAttribute,
    SearchPredicateModal.confirmPredicateSelection(true),
    ClassForm.focusOpenProperty(classView)
  ];
}

export function createNewClassItems(className: string, classComment: string, attributeNamespaceId: string, attributeName: string, gettextCatalog: gettextCatalog): Story[] {
  return [
    openAddResource('class'),
    SearchClassModal.filterForNewClass(className, gettextCatalog),
    SearchClassModal.selectAddNewClassSearchResult,
    SearchConceptModal.filterForConceptSuggestionConcept(className, gettextCatalog),
    SearchConceptModal.addConceptSuggestionSearchResult,
    SearchConceptModal.enterVocabulary,
    SearchConceptModal.enterLabel,
    SearchConceptModal.enterDefinition(classComment, gettextCatalog),
    SearchConceptModal.confirmConceptSelection(true),
    ClassForm.focusClass(classView),
    ...addAttributeItems(attributeNamespaceId, attributeName, gettextCatalog)
  ];
}

export function addAssociationItems(searchName: string, name: string, comment: string, associationTargetNamespaceId: string, associationTargetName: string, gettextCatalog: gettextCatalog): Story[] {
  return [
    ClassView.addProperty,
    SearchPredicateModal.filterForNewPredicate(searchName, gettextCatalog),
    SearchPredicateModal.selectAddNewPredicateSearchResult('association'),
    SearchConceptModal.filterForConceptSuggestionConcept(searchName, gettextCatalog),
    SearchConceptModal.addConceptSuggestionSearchResult,
    SearchConceptModal.enterVocabulary,
    SearchConceptModal.enterLabel,
    SearchConceptModal.enterDefinition(comment, gettextCatalog),
    SearchConceptModal.confirmConceptSelection(false),
    SearchPredicateModal.focusSelectedAssociation,
    // PredicateForm.focusPredicateLabel(SearchPredicateModal.searchPredicateModalElement, 'association', 'Label can be changed'),
    PredicateForm.enterPredicateLabel(SearchPredicateModal.searchPredicateModalElement, 'association', name, gettextCatalog),
    SearchPredicateModal.confirmPredicateSelection(true),
    ClassForm.focusOpenProperty(classView),
    ClassForm.selectAssociationTarget(classView),
    SearchClassModal.filterForClass(associationTargetNamespaceId, associationTargetName, gettextCatalog),
    SearchClassModal.selectClass(associationTargetNamespaceId, associationTargetName),
    SearchClassModal.focusSelectedClass,
    SearchClassModal.confirmClassSelection(false),
    ClassForm.focusAssociationTarget(classView),
    ClassView.saveClassChanges,
    VisualizationView.focusVisualization
  ];
}
