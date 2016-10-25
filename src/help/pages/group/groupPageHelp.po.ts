import { createClickNextCondition, createStory } from '../../contract';
import { KnownModelType } from '../../../entities/type';

function startModelCreation(type: KnownModelType) {

  const startModelCreationElement = () => angular.element(`#add-${type}-button`);

  return createStory({

    title: 'Add ' + type,
    content: 'Diipadaa',
    popover: {
      element: startModelCreationElement,
      position: 'left'
    },
    focus: { element: startModelCreationElement },
    nextCondition: createClickNextCondition(startModelCreationElement)
  });
}

export const startLibraryCreation = startModelCreation('library');
export const startProfileCreation = startModelCreation('profile');
