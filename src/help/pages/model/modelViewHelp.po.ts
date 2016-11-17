import {
  createClickNextCondition, createStory, createModifyingClickNextCondition,
  createExplicitNextCondition, createScrollNone, Story
} from '../../contract';
import { child } from '../../selectors';
import { KnownModelType } from '../../../entities/type';
import gettextCatalog = angular.gettext.gettextCatalog;
import * as SearchNamespaceModal from './modal/searchNamepaceModalHelp.po';

export const element = () => angular.element('model-view');

export function modifyModel(type: KnownModelType) {

  const modifyModelElement = child(element, 'button.edit');
  return createStory({

    title: 'Modify ' + type,
    content: 'Modify ' + type + ' description',
    popover: { element: modifyModelElement, position: 'left-down' },
    focus: { element: modifyModelElement },
    nextCondition: createModifyingClickNextCondition(modifyModelElement)
  });
}

const requireNamespaceElement = child(element, 'imported-namespaces-view button');
export const requireNamespace = createStory({

  title: 'Add reference to namespace',
  content: 'Add reference to namespace description',
  popover: { element: requireNamespaceElement, position: 'left-down' },
  focus: { element: requireNamespaceElement },
  nextCondition: createClickNextCondition(requireNamespaceElement)
});


const saveModelChangesElement = child(element, 'button.save');
export const saveModelChanges = createStory({

  title: 'Save changes',
  content: 'Changes need to be saved',
  popover: { element: saveModelChangesElement, position: 'left-down' },
  focus: { element: saveModelChangesElement },
  nextCondition: createModifyingClickNextCondition(saveModelChangesElement)
});

const focusNamespacesElement = child(element, 'imported-namespaces-view editable-table');
export const focusNamespaces = createStory({
  title: 'Imported namespaces are here',
  scroll: createScrollNone(),
  content: 'Imported namespaces can be used to link resources to existing standards',
  popover: { element: focusNamespacesElement, position: 'left-down' },
  focus: { element: focusNamespacesElement },
  denyInteraction: true,
  nextCondition: createExplicitNextCondition()
});

export function addNamespaceItems(ns: { prefix: string, namespaceId: string }, gettextCatalog: gettextCatalog): Story[] {
  return [
    requireNamespace,
    SearchNamespaceModal.filterForModel(ns.prefix, ns.namespaceId, gettextCatalog),
    SearchNamespaceModal.selectNamespace(ns.prefix, ns.namespaceId),
    focusNamespaces
  ];
}
