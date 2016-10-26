import { createClickNextCondition, createStory } from '../../contract';
import { modelView, child } from '../../selectors';
import { KnownModelType } from '../../../entities/type';

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
