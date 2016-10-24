import { modelView, child } from '../../selectors';
import { createStory, createNavigatingClickNextCondition } from '../../contract';

const saveUnsavedLibraryElement = child(modelView, 'button.save');
export const saveUnsavedLibrary = createStory({

  popoverTo: saveUnsavedLibraryElement,
  focusTo: { element: saveUnsavedLibraryElement },
  popoverPosition: 'left',
  title: 'Save changes',
  content: 'Diipadaa',
  nextCondition: createNavigatingClickNextCondition(saveUnsavedLibraryElement),
  cannotMoveBack: true
});
