import { createClickNextCondition, createStory } from '../../contract';
import { modelView, child } from '../../selectors';

const openModelDetailsElement = child(modelView, '.model-header');
export const openModelDetails = createStory({

  popoverTo: openModelDetailsElement,
  focusTo: { element: openModelDetailsElement },
  popoverPosition: 'bottom',
  title: 'Open library details',
  content: 'Diipadaa',
  nextCondition: createClickNextCondition(openModelDetailsElement),
  cannotMoveBack: true
});
