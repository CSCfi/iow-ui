import { createClickNextConfition, createStory } from '../../contract';
import { modelView, child } from '../../selectors';

const openLibraryDetailsElement = child(modelView, '.model-header');
export const openLibraryDetails = createStory({

  popoverTo: openLibraryDetailsElement,
  focusTo: { element: openLibraryDetailsElement },
  popoverPosition: 'bottom',
  title: 'Open library details',
  content: 'Diipadaa',
  nextCondition: createClickNextConfition(openLibraryDetailsElement),
  cannotMoveBack: true
});
