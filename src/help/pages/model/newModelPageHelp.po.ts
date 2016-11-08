import { modelView, child } from '../../selectors';
import { createStory, createNavigatingClickNextCondition } from '../../contract';

const saveUnsavedModelElement = child(modelView, 'button.save');
export const saveUnsavedModel = createStory({

  title: 'Save changes',
  content: 'Changes need to be saved',
  popover: { element: saveUnsavedModelElement, position: 'left-down' },
  focus: { element: saveUnsavedModelElement },
  nextCondition: createNavigatingClickNextCondition(saveUnsavedModelElement)
});
