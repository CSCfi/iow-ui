import { createClickNextConfition, createStory } from '../../contract';
import { KnownModelType } from '../../../entities/type';

function startModelCreation(type: KnownModelType) {

  const startModelCreationElement = () => angular.element(`#add-${type}-button`);

  return createStory({

    popoverTo: startModelCreationElement,
    focusTo: { element: startModelCreationElement },
    popoverPosition: 'left',
    title: 'Add ' + type,
    content: 'Diipadaa',
    nextCondition: createClickNextConfition(startModelCreationElement),
    cannotMoveBack: true
  });
}

export const startLibraryCreation = startModelCreation('library');
export const startProfileCreation = startModelCreation('profile');
