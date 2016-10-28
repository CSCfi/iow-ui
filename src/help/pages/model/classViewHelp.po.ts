import { child, classView } from '../../selectors';
import {
  createStory, createModifyingClickNextCondition, createExplicitNextCondition,
  createClickNextCondition
} from '../../contract';

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

const addPropertyElement = child(classView, 'button.add-property');
export const addProperty = createStory({
  title: 'Add property',
  popover: {
    element: addPropertyElement,
    position: 'left-down'
  },
  focus: { element: addPropertyElement },
  nextCondition: createClickNextCondition(addPropertyElement)
});

const focusOpenPropertyElement = child(classView, 'property-view div[ng-if="ctrl.isOpen()"]');
export const focusOpenProperty = createStory({
  title: 'Property is here',
  popover: {
    element: focusOpenPropertyElement,
    position: 'top-right'
  },
  focus: {
    element: focusOpenPropertyElement,
    denyInteraction: true,
    margin: { left: 10, right: 10, top: 10, bottom: 10 }
  },
  nextCondition: createExplicitNextCondition()
});
