import { createClickNextCondition, createStory } from '../../contract';
import { KnownModelType } from '../../../entities/type';

export function startModelCreation(type: KnownModelType) {

  const startModelCreationElement = () => angular.element(`#add-${type}-button`);

  return createStory({

    title: 'Add ' + type,
    content: 'Add ' + type + ' description',
    popover: { element: startModelCreationElement, position: 'left-down' },
    focus: { element: startModelCreationElement },
    nextCondition: createClickNextCondition(startModelCreationElement)
  });
}
