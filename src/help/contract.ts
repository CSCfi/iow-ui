export type PopoverPosition = 'top'|'right'|'left'|'bottom';

export type NextCondition = 'explicit'         // explicit next button to continue
  | 'click'            // click on element to continue
  | 'modifying-click'  // click on element which is expected to disappear to continue
  | 'valid-input';     // valid input is needed before allowing to continue

export interface StoryLine {
  title: string;
  description: string;
  stories: Story[];
  onComplete?: () => void;
  onCancel?: () => void;
}

export interface Story {
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
