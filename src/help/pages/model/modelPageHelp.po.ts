import { createClickNextCondition, createStory, createNavigatingClickNextCondition } from '../../contract';
import { modelView, child } from '../../selectors';
import { KnownModelType, KnownPredicateType } from '../../../entities/type';
import { classIdFromPrefixAndName } from '../../utils';

export function openModelDetails(type: KnownModelType) {

  const openModelDetailsElement = child(modelView, '.model-header');

  return createStory({

    title: `Open ${type} details`,
    content: 'Diipadaa',
    popover: {
      element: openModelDetailsElement,
      position: 'bottom-right'
    },
    focus: { element: openModelDetailsElement },
    nextCondition: createClickNextCondition(openModelDetailsElement)
  });
}

export function openAddResource(type: 'class' | KnownPredicateType) {

  const openAddResourceElement = () => angular.element('button.add-new-button');

  return createStory({
    popover: {
      element: openAddResourceElement,
      position: 'right-down'
    },
    focus: { element: openAddResourceElement },
    title: 'Add ' + type,
    content: 'Diipadaa',
    nextCondition: createClickNextCondition(openAddResourceElement)
  });
}

export function selectClass(prefix: string, name: string) {

  const selectClassElement = () => angular.element(`.model-panel--left li#${CSS.escape(classIdFromPrefixAndName(prefix, name))}`);

  return createStory({
    popover: {
      element: selectClassElement,
      position: 'top-right'
    },
    focus: { element: selectClassElement },
    title: 'Select ' + name.toLowerCase(),
    content: 'Diipadaa',
    nextCondition: createNavigatingClickNextCondition(selectClassElement)
  });
}
