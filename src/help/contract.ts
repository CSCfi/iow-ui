import { IPromise } from 'angular';
import { InteractiveHelpService } from './services/interactiveHelpService';

export type PopoverPosition = 'top-left'
                            | 'top-right'
                            | 'right-up'
                            | 'right-down'
                            | 'left-up'
                            | 'left-down'
                            | 'bottom-left'
                            | 'bottom-right';

export type Explicit =        { type: 'explicit' };                                      // explicit next button to continue
export type Click =           { type: 'click', element: () => JQuery };                  // click on element to continue
export type NavigatingClick = { type: 'navigating-click', element: () => JQuery };       // click on element which is expected to change location
export type ModifyingClick =  { type: 'modifying-click', element: () => JQuery };        // click on element which is expected to disappear to continue
export type ValidInput =      { type: 'valid-input', element: () => JQuery }             // valid input is needed before allowing to continue
export type ElementExists =   { type: 'element-exists', element: () => JQuery };         // element must exist before continue is allowed

export type NextCondition = Explicit
                          | Click
                          | NavigatingClick
                          | ModifyingClick
                          | ValidInput
                          | ElementExists;


export interface HelpEventHandler {
  onInit?: (service: InteractiveHelpService) => IPromise<boolean>; // result boolean indicates if initialization will change location
  onComplete?: () => void;
  onCancel?: () => void;
}

export interface InteractiveHelp extends HelpEventHandler {
  storyLine: StoryLine;
}

export interface StoryLine {
  title: string;
  description: string;
  items: (Story|Notification)[];
}

export interface Notification extends NotificationDetails {
  type: 'notification';
}

export interface NotificationDetails {
  title: string;
  content: string;
}

export interface Story extends StoryDetails {
  type: 'story';
}

export interface StoryDetails {
  title: string;
  content: string;
  popover: {
    element: () => JQuery,
    position: PopoverPosition
  };
  focus?: {
    element: () => JQuery,
    margin?: { top?: number, right?: number, bottom?: number, left?: number }
  };
  nextCondition: NextCondition;
  initialInputValue?: {
    element: () => JQuery,
    value: string
  };
  reversible?: boolean;
}

export function createHelpWithDefaultHandler(storyLine: StoryLine, onFinish: () => void) {
  return {
    storyLine,
    onInit: (service: InteractiveHelpService) => service.reset().then(() => false),
    onComplete: onFinish,
    onCancel: onFinish
  };
}

export function createStory(storyDetails: StoryDetails) {
  return Object.assign({}, storyDetails, {
    type: 'story' as 'story'
  });
}

export function createNotification(notificationDetails: NotificationDetails): Notification {
  return Object.assign({}, notificationDetails, {
    type: 'notification' as 'notification'
  });
}

export function createExplicitNextCondition(): Explicit {
  return { type: 'explicit' };
}

export function createClickNextCondition(element: () => JQuery): Click {
  return { type: 'click', element };
}

export function createNavigatingClickNextCondition(element: () => JQuery): NavigatingClick {
  return { type: 'navigating-click', element };
}

export function createModifyingClickNextCondition(element: () => JQuery): ModifyingClick {
  return { type: 'modifying-click', element };
}

export function createValidInputNextCondition(element: () => JQuery): ValidInput {
  return { type: 'valid-input', element };
}

export function createElementExistsNextCondition(element: () => JQuery): ElementExists {
  return { type: 'element-exists', element };
}
