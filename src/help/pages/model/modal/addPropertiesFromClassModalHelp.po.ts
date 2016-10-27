import { createStory, createExplicitNextCondition } from '../../../contract';
import { modalBody, child, modal } from '../../../selectors';
import { confirm } from '../../modal/modalHelp.po';

const selectPropertiesElement = modalBody;
export const selectProperties = createStory({

  title: `Select properties`,
  content: 'Diipadaa',
  popover: {
    element: selectPropertiesElement,
    position: 'left-down'
  },
  focus: { element: selectPropertiesElement },
  nextCondition: createExplicitNextCondition()
});

export function confirmProperties(navigates: boolean) {
  return confirm(child(modal, '.add-properties-from-class'), navigates);
}
