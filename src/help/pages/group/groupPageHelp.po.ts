import { createClickNextConfition, createStory } from '../../contract';

const startLibraryCreationElement = () => angular.element('#add-library-button');
export const startLibraryCreation = createStory({

  popoverTo: startLibraryCreationElement,
  focusTo: { element: startLibraryCreationElement },
  popoverPosition: 'left',
  title: 'Add library',
  content: 'Diipadaa',
  nextCondition: createClickNextConfition(startLibraryCreationElement),
  cannotMoveBack: true
});
