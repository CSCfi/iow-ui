import { createStory, createExpectedStateNextCondition, createExplicitNextCondition } from '../../contract';
import { KnownPredicateType } from '../../../entities/type';
import { upperCaseFirst } from 'change-case';
import { editableByTitle, input, editableFocus } from '../../selectors';
import { validInput, initialInputValue, editableMarginInColumn } from '../../utils';

export function focusPredicateLabel(parent: () => JQuery, type: KnownPredicateType, storyTitle: string) {

  const title = upperCaseFirst(type) + ' label';
  const enterPredicateLabelElement = editableByTitle(parent, title);
  const enterPredicateLabelInputElement = input(enterPredicateLabelElement);

  return createStory({

    title: storyTitle,
    popover: { element: enterPredicateLabelInputElement, position: 'left-down' },
    focus: { element: editableFocus(enterPredicateLabelElement), margin: editableMarginInColumn },
    denyInteraction: true,
    nextCondition: createExplicitNextCondition(),
    reversible: true
  });
}

export function enterPredicateLabel(parent: () => JQuery, type: KnownPredicateType, initialValue: string) {

  const title = upperCaseFirst(type) + ' label';
  const enterPredicateLabelElement = editableByTitle(parent, title);
  const enterPredicateLabelInputElement = input(enterPredicateLabelElement);

  return createStory({

    title: title,
    content: title + ' info',
    popover: { element: enterPredicateLabelInputElement, position: 'left-down' },
    focus: { element: editableFocus(enterPredicateLabelElement), margin: editableMarginInColumn },
    nextCondition: createExpectedStateNextCondition(validInput(enterPredicateLabelInputElement)),
    reversible: true,
    initialize: initialInputValue(enterPredicateLabelInputElement, initialValue)
  });
}
