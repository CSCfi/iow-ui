import { child } from '../selectors';
import { createStory, createNavigatingClickNextCondition } from '../contract';

const browsePanel = () => angular.element('#browse-panel');
const selectGroupElement = child(browsePanel, '.selectable-panel__list');
export const selectGroup = createStory({

  popoverTo: selectGroupElement,
  focusTo: { element: browsePanel },
  popoverPosition: 'left',
  title: 'Select group',
  content: 'Diipadaa',
  nextCondition: createNavigatingClickNextCondition(selectGroupElement)
});
