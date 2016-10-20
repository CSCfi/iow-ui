export type PopoverPosition = 'top'|'right'|'left'|'bottom';

export type NextCondition = 'explicit'         // explicit next button to continue
  | 'click'            // click on element to continue
  | 'modifying-click'  // click on element which is expected to disappear to continue
  | 'valid-input';     // valid input is needed before allowing to continue

export interface StoryLine {
  title: string;
  description: string;
  items: (Story|Notification)[];
  onComplete?: () => void;
  onCancel?: () => void;
}

export interface Notification extends NotificationDetails {
  type: 'notification';
}

export interface NotificationDetails {
  title: string;
  content: string;
  cannotMoveBack?: boolean;
}

export interface Story extends StoryDetails {
  type: 'story';
}

export interface StoryDetails {
  popoverTo: () => JQuery;
  popoverPosition: PopoverPosition;
  focusTo?: () => {
    element: JQuery,
    margin?: { top?: number, right?: number, bottom?: number, left?: number }
  };
  title: string;
  content: string;
  nextCondition: NextCondition;
  initialInputValue?: any;
  cannotMoveBack?: boolean;
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
