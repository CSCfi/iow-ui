import { child, classView } from '../../selectors';
import { createStory, createModifyingClickNextCondition, createExplicitNextCondition } from '../../contract';

const saveClassChangesElement = child(classView, 'button.save');
export const saveClassChanges = createStory({

  title: 'Save changes',
  content: 'Diipadaa',
  popover: {
    element: saveClassChangesElement,
    position: 'left-down'
  },
  focus: { element: saveClassChangesElement },
  nextCondition: createModifyingClickNextCondition(saveClassChangesElement)
});

const focusClassElement = child(classView, 'form');
export const focusClass = createStory({
  title: 'Class is here',
  popover: {
    element: focusClassElement,
    position: 'top-right'
  },
  focus: {
    element: focusClassElement,
    denyInteraction: true
  },
  nextCondition: createExplicitNextCondition()
});
