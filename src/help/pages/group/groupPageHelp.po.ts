import { createClickNextCondition, createStory } from '../../contract';
import { KnownModelType } from '../../../entities/type';
import * as AddModelModal from './modal/addModelModalHelp.po';
import gettextCatalog = angular.gettext.gettextCatalog;

export function startModelCreation(type: KnownModelType) {

  const startModelCreationElement = () => angular.element(`#add-${type}-button`);

  return createStory({

    title: 'Add ' + type,
    content: 'Add ' + type + ' description',
    popover: { element: startModelCreationElement, position: 'left-down' },
    focus: { element: startModelCreationElement },
    nextCondition: createClickNextCondition(startModelCreationElement)
  });
}

export function createModel(type: KnownModelType, prefix: string, name: string, gettextCatalog: gettextCatalog) {
  return [
    startModelCreation(type),
    AddModelModal.enterModelPrefix(prefix),
    AddModelModal.enterModelLanguage,
    AddModelModal.enterModelLabel(type, name, gettextCatalog),
    AddModelModal.createModel
  ];
}
