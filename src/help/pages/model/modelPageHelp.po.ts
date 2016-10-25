import { createClickNextCondition, createStory } from '../../contract';
import { modelView, child } from '../../selectors';

const openModelDetailsElement = child(modelView, '.model-header');
export const openModelDetails = createStory({

  title: 'Open library details',
  content: 'Diipadaa',
  popover: {
    element: openModelDetailsElement,
    position: 'bottom'
  },
  focus: { element: openModelDetailsElement },
  nextCondition: createClickNextCondition(openModelDetailsElement)
});
