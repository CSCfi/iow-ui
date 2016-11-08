import {
  createClickNextCondition, createStory, createNavigatingClickNextCondition,
  createScrollWithDefault
} from '../../contract';
import { modelView, child, modelPanelElement } from '../../selectors';
import { KnownModelType, KnownPredicateType } from '../../../entities/type';
import { scrollToTop, classIdFromNamespaceId } from '../../utils';

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
