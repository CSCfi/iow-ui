import { child } from '../../selectors';
import { createStory, createNavigatingClickNextCondition } from '../../contract';
import * as ModelView from './modelViewHelp.po';

const saveUnsavedModelElement = child(ModelView.element, 'button.save');
export const saveUnsavedModel = createStory({

  title: 'Save changes',
  content: 'Changes need to be saved',
  popover: { element: saveUnsavedModelElement, position: 'left-down' },
  focus: { element: saveUnsavedModelElement },
  nextCondition: createNavigatingClickNextCondition(saveUnsavedModelElement)
});
