import { createModifyingClickNextCondition, createStory, createNavigatingClickNextCondition } from '../../contract';
import { child } from '../../selectors';

export function confirm(parent: () => JQuery, navigates: boolean) {

  const confirmButtonElement = child(parent, 'button.confirm');

  return createStory({

    title: 'Confirm selection',
    content: 'Diipadaa',
    popover: { element: confirmButtonElement, position: 'top-left' },
    focus: { element: confirmButtonElement },
    nextCondition: navigates ? createNavigatingClickNextCondition(confirmButtonElement)
                             : createModifyingClickNextCondition(confirmButtonElement)
  });
}
