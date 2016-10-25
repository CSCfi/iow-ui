import { modelView, child } from '../../selectors';
import { createStory, createNavigatingClickNextCondition } from '../../contract';

const saveUnsavedModelElement = child(modelView, 'button.save');
export const saveUnsavedModel = createStory({

  popoverTo: saveUnsavedModelElement,
  focusTo: { element: saveUnsavedModelElement },
  popoverPosition: 'left',
  title: 'Save changes',
  content: 'Diipadaa',
  nextCondition: createNavigatingClickNextCondition(saveUnsavedModelElement)
});
