import { createClickNextCondition, createStory } from '../../contract';
import { modelView, child } from '../../selectors';
import { KnownModelType, KnownPredicateType } from '../../../entities/type';

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
