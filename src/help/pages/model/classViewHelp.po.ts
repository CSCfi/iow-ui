import { child, classView } from '../../selectors';
import {
  createStory, createModifyingClickNextCondition,
  createClickNextCondition, createScrollWithDefault, createScrollNone
} from '../../contract';

const modifyClassElement = child(classView, 'button.edit');
export const modifyClass = createStory({

  title: 'Modify class',
  content: 'Diipadaa',
  scroll: createScrollWithDefault(classView),
  popover: {
    element: modifyClassElement,
    position: 'left-down'
  },
  focus: { element: modifyClassElement },
  nextCondition: createModifyingClickNextCondition(modifyClassElement)
});

const saveClassChangesElement = child(classView, 'button.save');
export const saveClassChanges = createStory({

  title: 'Save changes',
  content: 'Diipadaa',
  scroll: createScrollNone(),
  popover: {
    element: saveClassChangesElement,
    position: 'left-down'
  },
  focus: { element: saveClassChangesElement },
  nextCondition: createModifyingClickNextCondition(saveClassChangesElement)
});

const addPropertyElement = child(classView, 'button.add-property');
export const addProperty = createStory({
  title: 'Add property',
  scroll: createScrollNone(),
  popover: {
    element: addPropertyElement,
    position: 'left-down'
  },
  focus: { element: addPropertyElement },
  nextCondition: createClickNextCondition(addPropertyElement)
});
