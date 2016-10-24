import { createClickNextConfition, createStory, createModifyingClickNextCondition } from '../../contract';
import { modelView, child } from '../../selectors';

const modifyLibraryElement = child(modelView, 'button.edit');
export const modifyLibrary = createStory({

  popoverTo: modifyLibraryElement,
  focusTo: { element: modifyLibraryElement },
  popoverPosition: 'left',
  title: 'Modify library',
  content: 'Diipadaa',
  nextCondition: createModifyingClickNextCondition(modifyLibraryElement),
  cannotMoveBack: true
});

const requireNamespaceElement = child(modelView, 'imported-namespaces-view button');
export const requireNamespace = createStory({

  popoverTo: requireNamespaceElement,
  focusTo: { element: requireNamespaceElement },
  popoverPosition: 'left',
  title: 'Add reference to namespace',
  content: 'Diipadaa',
  nextCondition: createClickNextConfition(requireNamespaceElement),
  cannotMoveBack: true
});


const saveLibraryChangesElement = child(modelView, 'button.save');
export const saveLibraryChanges = createStory({

  popoverTo: saveLibraryChangesElement,
  focusTo: { element: saveLibraryChangesElement },
  popoverPosition: 'left',
  title: 'Save changes',
  content: 'Diipadaa',
  nextCondition: createModifyingClickNextCondition(saveLibraryChangesElement),
  cannotMoveBack: true
});
