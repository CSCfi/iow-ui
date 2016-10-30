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
export type ExpectedState =   { type: 'expected-state', valid: () => boolean }           // free control for validation


export type NextCondition = Explicit
                          | Click
                          | NavigatingClick
                          | ModifyingClick
                          | ExpectedState;

export type ScrollWithDefault = { type: 'scroll-with-default', element: () => JQuery, offsetFromTop?: number };
export type ScrollWithElement = { type: 'scroll-with-element', scrollElement: () => JQuery, element: () => JQuery, offsetFromTop?: number };
export type ScrollNone =        { type: 'scroll-none' };


export type Scroll = ScrollWithDefault
                   | ScrollWithElement
                   | ScrollNone;

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
  content?: string;
  scroll?: Scroll; // when not defined it will be implicitly ScrollWithDefault to popover element with 100px offset
  popover: {
    element: () => JQuery,
    position: PopoverPosition
  };
  focus?: {
    element: () => JQuery,
    margin?: { top?: number, right?: number, bottom?: number, left?: number }
    denyInteraction?: boolean
  };
  nextCondition: NextCondition;
  initialize?: () => void;
  reversible?: boolean;
}

export function createHelpWithDefaultHandler(storyLine: StoryLine, onFinish: () => void) {
  return {
    storyLine,
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

export function createExpectedStateNextCondition(valid: () => boolean): ExpectedState {
  return { type: 'expected-state', valid };
}

export function createScrollWithDefault(element: () => JQuery, offsetFromTop?: number): ScrollWithDefault {
  return { type: 'scroll-with-default', element, offsetFromTop };
}

export function createScrollWithElement(scrollElement: () => JQuery, element: () => JQuery, offsetFromTop?: number): ScrollWithElement {
  return { type: 'scroll-with-element', scrollElement, element, offsetFromTop };
}

export function createScrollNone(): ScrollNone {
  return { type: 'scroll-none' };
}
