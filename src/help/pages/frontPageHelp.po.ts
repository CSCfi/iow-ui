import { child } from '../selectors';
import { createStory, createNavigatingClickNextCondition } from '../contract';

const browsePanel = () => angular.element('#browse-panel');
const selectGroupElement = child(browsePanel, '.selectable-panel__list');
export const selectGroup = createStory({

  title: 'Select group',
  content: 'Diipadaa',
  popover: { element: selectGroupElement, position: 'left-down' },
  focus: { element: browsePanel },
  nextCondition: createNavigatingClickNextCondition(selectGroupElement, true)
});
