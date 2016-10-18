import { module as mod } from './module';
import { OverlayService, OverlayInstance } from './overlay';
import { IScope, IDocumentService, INgModelController, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import { assertNever } from '../../utils/object';
import { tab, esc } from '../../utils/keyCode';
import { isTargetElementInsideElement } from '../../utils/angular';

export type PopoverPosition = 'top'|'right'|'left'|'bottom';

export type NextCondition = 'explicit'         // explicit next button to continue
                          | 'click'            // click on element to continue
                          | 'modifying-click'  // click on element which is expected to disappear to continue
                          | 'valid-input';     // valid input is needed before allowing to continue

export interface StoryLine {
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
  cannotMoveBack?: boolean;
}

interface Positioning {
  left: number;
  top: number;
  width?: number;
  height?: number;
  right?: number;
  bottom?: number;
}

interface StyleSetState {
  offsetStabileCheck: { left: number, top: number }|null;
  debounceHandle?: any;
  debounceCount: number;
  animating: boolean;
  waitingForStoryToChange: boolean;
}

export class InteractiveHelp {

  /* @ngInject */
  constructor(private overlayService: OverlayService) {
  }

  open(storyLine: StoryLine) {
    return this.overlayService.open({
      template: `
        <help-popover class="help-popover" help-controller="ctrl" ng-style="ctrl.popoverStyle()"></help-popover>
        <div ng-show="ctrl.backdrop" class="help-backdrop" ng-style="ctrl.backdrop.top"></div>
        <div ng-show="ctrl.backdrop" class="help-backdrop" ng-style="ctrl.backdrop.right"></div>
        <div ng-show="ctrl.backdrop" class="help-backdrop" ng-style="ctrl.backdrop.bottom"></div>
        <div ng-show="ctrl.backdrop" class="help-backdrop" ng-style="ctrl.backdrop.left"></div>
      `,
      controller: InteractiveHelpController,
      controllerAs: 'ctrl',
      resolve: {
        storyLine: () => storyLine
      },
      disableScroll: true
    }).result;
  }
}

const focusableSelector = 'a[href], area[href], input:not([disabled]), ' +
                          'button:not([disabled]),select:not([disabled]), textarea:not([disabled]), ' +
                          'iframe, object, embed, *[tabindex], *[contenteditable=true]';

function isClick(nextCondition: NextCondition) {
  return nextCondition === 'click' || nextCondition === 'modifying-click';
}

class InteractiveHelpController {

  popoverController: HelpPopoverController;
  activeIndex = 0;
  backdrop: { top: Positioning, right: Positioning, bottom: Positioning, left: Positioning } | null;
  popoverOffset: { left: number; top: number } | null = null;

  private styleSetState: StyleSetState = {
    offsetStabileCheck: null,
    debounceCount: 0,
    animating: false,
    waitingForStoryToChange: false
  };

  /* @ngInject */
  constructor(public $scope: IScope, private $overlayInstance: OverlayInstance, private $document: IDocumentService, private $uibModalStack: IModalStackService, private storyLine: StoryLine) {

    if (!storyLine || storyLine.stories.length === 0) {
      throw new Error('No stories defined');
    }

    // Active element needs to be blurred because it can used for example for multiple interactive help activations
    angular.element(document.activeElement).blur();

    function isVisible(element: HTMLElement) {
      return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    }

    function elementExists(e: JQuery) {
      return e && e.length > 0 && isVisible(e[0]);
    }

    const isFocusInElement = (element: HTMLElement) => (event.target || event.srcElement) === element;

    const loadFocusableElementList = () => {

      const story = this.currentStory();

      if (!story.focusTo) {
        return [];
      }

      const focusableElements = story.focusTo().element.find(focusableSelector).addBack(focusableSelector);
      const result: HTMLElement[] = [];

      focusableElements.each((_index: number, element: HTMLElement) => {
        if (isVisible(element) && (!element.tabIndex || element.tabIndex > 0)) {
          result.push(element);
        }
      });

      return result;
    };

    function stopEvent() {
      event.preventDefault();
      event.stopPropagation();
    }

    const manageFocus = (event: JQueryEventObject) => {
      const focusableElements = loadFocusableElementList();

      const activeElementIsFocusable = () => {
        for (const focusableElement of focusableElements) {
          if (focusableElement === document.activeElement) {
            return true;
          }
        }
        return false;
      };

      if (focusableElements.length > 0) {

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (isFocusInElement(firstElement)) {
            if (!this.currentStory().cannotMoveBack) {
              $scope.$apply(() => this.previousStory());
            }
            stopEvent();
          }
        } else {
          if (isFocusInElement(lastElement)) {
            if (!isClick(this.currentStory().nextCondition) && this.popoverController.isValid()) {
              $scope.$apply(() => this.nextStory());
            } else {
              firstElement.focus();
            }
            stopEvent();
          }
        }

        // prevent input focus breaking from story focusable area
        if (!activeElementIsFocusable()) {
          firstElement.focus();
          stopEvent();
        }

      } else {
        stopEvent();
      }
    };

    const manageNextClick = (currentStory: Story) => {

      if (currentStory.nextCondition === 'modifying-click') {

        let tryCount = 0;

        const waitForElementToDisappear = () => {

          if (tryCount > 20) {
            // reset values to state as before wait
            $scope.$apply(() => {
              this.styleSetState.waitingForStoryToChange = false;
              this.backdrop = this.calculateBackdrop(InteractiveHelpController.calculateFocus(currentStory));
              this.popoverOffset = this.popoverController.calculateOffset();
            });
            return;
          }

          if (elementExists(currentStory.popoverTo())) {
            tryCount++;
            setTimeout(waitForElementToDisappear, 50);
          } else {
            $scope.$apply(() => this.nextStory());
          }
        };

        waitForElementToDisappear();
        $scope.$apply(() => this.waitForStoryChange(this.peekNext()));

      } else {
        $scope.$apply(() => this.nextStory());
      }
    };

    const keyDownListener = (event: JQueryEventObject) => {

      switch (event.which) {
        case tab:
          manageFocus(event);
          break;
        case esc:
          $scope.$apply(() => this.close(true));
          break;
      }
    };

    const clickListener = (event: JQueryEventObject) => {
      const story = this.currentStory();

      if (story && isClick(story.nextCondition)) {
        const popoverElement = story.popoverTo();

        if (!elementExists(popoverElement)) {
          throw new Error('Popover element not found');
        }

        if (isTargetElementInsideElement(event, popoverElement[0])) {
          manageNextClick(story);
        }
      }
    };

    // Lazy initialization of listeners so that it doesn't intervene with help opening event
    window.setTimeout(() => {
      $document.on('keydown', keyDownListener);
      $document.on('click', clickListener);
    });

    $scope.$on('$destroy', function() {
      $document.off('keydown', keyDownListener);
      $document.off('click', clickListener);
    });

    $scope.$watch(() => InteractiveHelpController.calculateFocus(this.currentStory()), positioning => {
      if (!this.styleSetState.waitingForStoryToChange) {
        this.backdrop = this.calculateBackdrop(positioning);
      }
    }, true);

    $scope.$watch(() => this.popoverController.calculateOffset(), () => this.setStoryStyles(), true);

    const setStoryStylesApplyingScope = () => $scope.$apply(() => this.setStoryStyles());

    window.addEventListener('resize', setStoryStylesApplyingScope);
    window.addEventListener('scroll', setStoryStylesApplyingScope);

    $scope.$on('$destroy', () => {
      window.removeEventListener('resize', setStoryStylesApplyingScope);
      window.removeEventListener('scroll', setStoryStylesApplyingScope);
    });
  }

  popoverStyle() {
    return this.popoverOffset ? this.popoverOffset : { visibility: 'hidden' };
  }

  register(popover: HelpPopoverController) {
    this.popoverController = popover;
    this.showStory(this.activeIndex);
  }

  private waitForStoryChange(nextStory: Story|null) {

    this.styleSetState.waitingForStoryToChange = true;
    this.popoverController.hide();

    if (nextStory && nextStory.focusTo) {
      // full backdrop
      this.backdrop = {
        top: { left: 0, top: 0, right: 0, bottom: 0 },
        right: { left: 0, top: 0, width: 0, height: 0 },
        bottom: { left: 0, top: 0, width: 0, height: 0 },
        left: { left: 0, top: 0, width: 0, height: 0 }
      };
    } else {
      // hide backdrop
      this.backdrop = null;
    }
  }

  private static calculateFocus(story: Story) {

    if (!story || !story.focusTo) {
      return null;
    }

    const focusTo = story.focusTo();

    if (!focusTo.element || focusTo.element.length === 0) {
      return null;
    }

    const focusToElementOffset = focusTo.element.offset();

    const marginTop = focusTo.margin && focusTo.margin.top || 0;
    const marginRight = focusTo.margin && focusTo.margin.right || 0;
    const marginBottom = focusTo.margin && focusTo.margin.bottom || 0;
    const marginLeft = focusTo.margin && focusTo.margin.left || 0;

    return {
      width: focusTo.element.outerWidth(false) + marginLeft + marginRight,
      height: focusTo.element.outerHeight(false) + marginTop + marginBottom,
      left: focusToElementOffset.left - marginLeft,
      top: focusToElementOffset.top - marginTop
    };
  }

  private calculateBackdrop(positioning: Positioning|null) {
    if (positioning) {
      return {
        top: {
          left: 0,
          top: 0,
          right: 0,
          height: positioning.top - window.scrollY
        },
        right: {
          left: positioning.left + positioning.width,
          top: positioning.top - window.scrollY,
          width: this.$document.width() - positioning.left - positioning.width,
          height: positioning.height
        },
        bottom: {
          left: 0,
          top: positioning.top + positioning.height - window.scrollY,
          right: 0,
          bottom: 0
        },
        left: {
          left: 0,
          top: positioning.top - window.scrollY,
          width: positioning.left,
          height: positioning.height
        }
      };
    } else {
      return null;
    }
  }

  private setStoryStyles() {

    const state = this.styleSetState;
    const story = this.currentStory();

    const debounce = () => {
      state.offsetStabileCheck = this.popoverController.calculateOffset();

      if (state.debounceHandle) {
        state.debounceCount++;
        clearTimeout(state.debounceHandle);
      }

      if (state.debounceCount > 20) {
        console.log(story);
        throw new Error('Element not or does not stabilize');
      }

      state.debounceHandle = setTimeout(applyPositioningAndFocusWhenStabile, 100);
    };

    const applyPositioningAndFocusWhenStabile = () => {

      let offset = this.popoverController.calculateOffset();

      if (offset && state.offsetStabileCheck && offset.left === state.offsetStabileCheck.left && offset.top === state.offsetStabileCheck.top) {

        story.popoverTo().find(focusableSelector).addBack(focusableSelector).focus();

        if (!state.animating) {
          const scrollElement = this.$uibModalStack.getTop() ? this.$uibModalStack.getTop().value.modalDomEl.find('.modal-content') : 'html, body';
          angular.element(scrollElement).animate({scrollTop: offset.top - 100}, 100);
          state.animating = true;
          debounce();
        } else {
          this.$scope.$apply(() => {
            this.styleSetState.waitingForStoryToChange = false;
            this.popoverOffset = offset;
            this.backdrop = this.calculateBackdrop(InteractiveHelpController.calculateFocus(story));
          });
        }
      } else {
        debounce();
      }
    };

    if (state.waitingForStoryToChange) {
      return;
    }

    this.waitForStoryChange(story);

    state.debounceCount = 0;
    state.animating = false;

    debounce();
  }

  peekNext(): Story|null {
    if (this.isCurrentLastStory()) {
      return null;
    } else {
      return this.storyLine.stories[this.activeIndex + 1];
    }
  }

  nextStory() {
    if (this.isCurrentLastStory()) {
      this.close(false);
    } else {
      this.showStory(++this.activeIndex);
    }
  }

  previousStory() {
    if (this.isCurrentFirstStory()) {
      this.close(true);
    } else {
      this.showStory(--this.activeIndex);
    }
  }

  isFirstStory(index: number) {
    return index === 0;
  }

  isLastStory(index: number) {
    return index === this.storyLine.stories.length - 1;
  }

  isCurrentFirstStory() {
    return this.isFirstStory(this.activeIndex);
  }

  isCurrentLastStory() {
    return this.isLastStory(this.activeIndex);
  }

  showStory(index: number) {
    const story = this.storyLine.stories[index];
    this.popoverController.show(story, this.isFirstStory(index), this.isLastStory(index));
  }

  currentStory() {
    return this.storyLine.stories[this.activeIndex];
  }

  close(cancel: boolean) {
    this.$overlayInstance.close();

    if (cancel) {
      if (this.storyLine.onCancel) {
        this.storyLine.onCancel();
      }
    } else {
      if (this.storyLine.onComplete) {
        this.storyLine.onComplete();
      }
    }
  }
}

mod.directive('helpPopover', () => {
  return {
    restrict: 'E',
    template: `
        <span ng-class="ctrl.arrowClass"></span>
      
        <div class="help-content-wrapper">
          <h3>{{ctrl.story.title | translate}}</h3>
          <p>{{ctrl.story.content | translate}}</p>
          <button ng-if="!ctrl.first && ctrl.showPrevious" ng-click="ctrl.previous()" class="small button help-navigate" translate>previous</button>
          <button ng-if="!ctrl.last && ctrl.showNext" ng-disabled="!ctrl.isValid()" ng-click="ctrl.next()" class="small button help-navigate" translate>next</button>
          <button ng-if="ctrl.last && ctrl.showNext" ng-disabled="!ctrl.isValid()" ng-click="ctrl.close(false)" class="small button help-next" translate>close</button>
          <a ng-click="ctrl.close(true)" class="help-close">&times;</a>
        </div>
      `,
    bindToController: true,
    scope: {
      helpController: '<'
    },
    controller: HelpPopoverController,
    controllerAs: 'ctrl'
  };
});

class HelpPopoverController {

  helpController: InteractiveHelpController;

  story: Story;
  last: boolean;
  first: boolean;
  arrowClass: string[] = [];
  showNext: boolean;
  showPrevious: boolean;
  ngModel: INgModelController|null;

  constructor(private $element: JQuery, private $document: IDocumentService) {
    this.helpController.register(this);
  }

  isValid() {
    return !this.ngModel || this.ngModel.$valid;
  }

  show(story: Story, first: boolean, last: boolean) {
    this.story = story;
    this.arrowClass = ['help-arrow', `help-${story.popoverPosition}`];
    this.first = first;
    this.last = last;
    this.showNext = !isClick(story.nextCondition);
    this.showPrevious = !story.cannotMoveBack;

    if (story.nextCondition === 'valid-input') {
      this.ngModel = story.popoverTo().find('[ng-model]').addBack('[ng-model]').controller('ngModel');

      if (!this.ngModel) {
        throw new Error('ng-model does not exits for popover element');
      }
    }
  }

  hide() {
    this.helpController.popoverOffset = null;
  }

  close(cancel: boolean) {
    this.hide();
    this.helpController.close(cancel);
  }

  next() {
    this.helpController.nextStory();
  }

  previous() {
    this.helpController.previousStory();
  }

  calculateOffset(): Positioning|null {

    const element = this.story.popoverTo();
    const position = this.story.popoverPosition;

    if (!element || element.length === 0) {
      return null;
    }

    const popoverWidth = this.$element.width();
    const popoverHeight = this.$element.height();
    const left = element.offset().left;
    const top = element.offset().top;
    const width = element.width();
    const height = element.height();
    const arrow = 13;
    const documentWidth = angular.element(this.$document).width();

    switch (position) {
      case 'left':
        const leftPopoverLeft = left - popoverWidth - arrow;
        const leftWidthOffScreen = leftPopoverLeft < 0 ? -leftPopoverLeft : 0;
        return { top: top, left: leftPopoverLeft + leftWidthOffScreen, width: popoverWidth - leftWidthOffScreen };
      case 'right':
        const rightPopoverLeft = left + width + arrow * 3;
        const rightPopoverRight = documentWidth - (rightPopoverLeft + popoverWidth);
        const rightWidthOffScreen = rightPopoverRight < 0 ? -rightPopoverRight : 0;
        return { top: top, left: left + width + arrow * 3, width: popoverWidth - rightWidthOffScreen};
      case 'top':
        return { top: top - popoverHeight - arrow, left: left };
      case 'bottom':
        return { top: top + height + arrow * 2, left: left };
      default:
        return assertNever(position);
    }
  }
}
