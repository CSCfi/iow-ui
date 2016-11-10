import { child, classView } from '../../selectors';
import {
  createStory, createModifyingClickNextCondition,
  createClickNextCondition, createScrollWithDefault, createScrollNone
} from '../../contract';

const modifyClassElement = child(classView, 'button.edit');
export const modifyClass = createStory({

  title: 'Modify class',
  content: 'Classes can be modified',
  scroll: createScrollWithDefault(classView),
  popover: { element: modifyClassElement, position: 'left-down' },
  focus: { element: modifyClassElement },
  nextCondition: createModifyingClickNextCondition(modifyClassElement)
});

const saveClassChangesElement = child(classView, 'button.save');
export const saveClassChanges = createStory({

  title: 'Save changes',
  content: 'Changes need to be saved',
  scroll: createScrollNone(),
  popover: { element: saveClassChangesElement, position: 'left-down' },
  focus: { element: saveClassChangesElement },
  nextCondition: createModifyingClickNextCondition(saveClassChangesElement)
});

const addPropertyElement = child(classView, 'button.add-property');
export const addProperty = createStory({
  title: 'Add property',
  content: 'You can add new attribute or association to the Class from here',
  scroll: createScrollNone(),
  popover: { element: addPropertyElement, position: 'left-down' },
  focus: { element: addPropertyElement },
  nextCondition: createClickNextCondition(addPropertyElement)
});
