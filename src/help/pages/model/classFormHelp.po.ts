import {
  createStory, createClickNextCondition, createExplicitNextCondition, createScrollNone, createScrollWithDefault, Story
} from '../../contract';
import { editableByTitle, child, editableFocus } from '../../selectors';
import { editableMarginInColumn } from '../../utils';
import * as SearchClassModal from './modal/searchClassModalHelp.po';
import * as AddPropertiesFromClassModal from './modal/addPropertiesFromClassModalHelp.po';
import gettextCatalog = angular.gettext.gettextCatalog;

export function focusClass(parent: () => JQuery) {

  const focusClassElement = child(parent, 'form');

  return createStory({
    title: 'Class is here',
    content: 'Class is here info',
    popover: { element: focusClassElement, position: 'top-right' },
    focus: { element: focusClassElement },
    denyInteraction: true,
    nextCondition: createExplicitNextCondition()
  });
}

export function focusOpenProperty(parent: () => JQuery) {

  const focusOpenPropertyElement = child(parent, 'property-view div[ng-if="ctrl.isOpen()"]');

  return createStory({
    title: 'Property is here',
    content: 'Property is here info',
    scroll: createScrollNone(),
    popover: { element: focusOpenPropertyElement, position: 'right-down' },
    focus: { element: focusOpenPropertyElement, margin: { left: 10, right: 10, top: 0, bottom: 10 } },
    denyInteraction: true,
    nextCondition: createExplicitNextCondition()
  });
}

export function selectAssociationTarget(parent: () => JQuery) {

  const enterAssociationTargetElement = editableByTitle(parent, 'Value class');
  const enterAssociationTargetSelectButtonElement = child(enterAssociationTargetElement, 'button');

  return createStory({

    title: 'Select association target',
    content: 'Association target must be selected from list of existing classes',
    scroll: createScrollNone(),
    popover: { element: enterAssociationTargetSelectButtonElement, position: 'right-down' },
    focus: { element: enterAssociationTargetSelectButtonElement },
    nextCondition: createClickNextCondition(enterAssociationTargetSelectButtonElement)
  });
}

export function selectSuperClass(parent: () => JQuery) {

  const enterSuperClassElement = editableByTitle(parent, 'Superclass');
  const enterSuperClassSelectButtonElement = child(enterSuperClassElement, 'button');

  return createStory({

    title: 'Select super class',
    content: 'Super class must be selected from list of existing classes',
    scroll: createScrollNone(),
    popover: { element: enterSuperClassSelectButtonElement, position: 'right-down' },
    focus: { element: enterSuperClassSelectButtonElement },
    nextCondition: createClickNextCondition(enterSuperClassSelectButtonElement)
  });
}

export function focusAssociationTarget(parent: () => JQuery) {

  const enterAssociationTargetElement = editableByTitle(parent, 'Value class');
  const enterAssociationTargetSelectFocusElement = editableFocus(enterAssociationTargetElement);

  return createStory({

    title: 'Association target is here',
    content: 'Association target can be changed from the list or by typing the identifier',
    scroll: createScrollWithDefault(enterAssociationTargetElement, 150),
    popover: { element: enterAssociationTargetSelectFocusElement, position: 'right-down' },
    focus: { element: enterAssociationTargetSelectFocusElement, margin: editableMarginInColumn },
    denyInteraction: true,
    nextCondition: createExplicitNextCondition()
  });
}

export function focusSuperClass(parent: () => JQuery) {

  const enterSuperClassElement = editableByTitle(parent, 'Superclass');
  const enterSuperClassSelectFocusElement = editableFocus(enterSuperClassElement);

  return createStory({

    title: 'Super class is here',
    content: 'Super class can be changed from the list or by typing the identifier',
    scroll: createScrollWithDefault(enterSuperClassElement, 150),
    popover: { element: enterSuperClassSelectFocusElement, position: 'right-down' },
    focus: { element: enterSuperClassSelectFocusElement, margin: editableMarginInColumn },
    denyInteraction: true,
    nextCondition: createExplicitNextCondition()
  });
}

export function addAssociationTargetItems(context: () => JQuery, target: { namespaceId: string, name: string }, gettextCatalog: gettextCatalog): Story[] {
  return [
    selectAssociationTarget(context),
    ...SearchClassModal.findAndSelectExistingClassItems(target.namespaceId, target.name, false, gettextCatalog),
    focusAssociationTarget(context)
  ];
}

export function addSuperClassItems(context: () => JQuery, superClass: { name: string, namespaceId: string, properties: string[] }, gettextCatalog: gettextCatalog): Story[] {
  return [
    selectSuperClass(context),
    ...SearchClassModal.findAndSelectExistingClassItems(superClass.namespaceId, superClass.name, false, gettextCatalog),
    ...AddPropertiesFromClassModal.selectAndConfirmPropertiesItems('Select registration number and vehicle code', false, superClass.properties),
    focusSuperClass(context)
  ];
}
