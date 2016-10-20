import { module as mod } from './module';
import { OverlayService, OverlayInstance } from './overlay';
import { IScope, IDocumentService, INgModelController, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import { assertNever } from '../../utils/object';
import { tab, esc } from '../../utils/keyCode';
import { isTargetElementInsideElement } from '../../utils/angular';
import { InteractiveHelpService } from '../../help/services/interactiveHelpService';
import { StoryLine, NextCondition, Story, Notification, Click, ModifyingClick } from '../../help/contract';

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
  waitingForItemToChange: boolean;
}

export class InteractiveHelp {

  /* @ngInject */
  constructor(private overlayService: OverlayService, private interactiveHelpService: InteractiveHelpService) {
  }

  open(storyLine: StoryLine) {

    if (this.interactiveHelpService.open) {
      throw new Error('Cannot open help when another help is already open');
    }

    return this.interactiveHelpService.reset().then(() => {
      this.interactiveHelpService.open = true;

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
      }).result.then(() => this.interactiveHelpService.open = false);
    });
  }
}

const focusableSelector = 'a[href], area[href], input:not([disabled]), ' +
                          'button:not([disabled]),select:not([disabled]), textarea:not([disabled]), ' +
                          'iframe, object, embed, *[tabindex], *[contenteditable=true]';

function isClick(nextCondition: NextCondition): nextCondition is Click|ModifyingClick {
  return nextCondition.type === 'click' || nextCondition.type === 'modifying-click';
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
    waitingForItemToChange: false
  };

  /* @ngInject */
  constructor(public $scope: IScope, private $overlayInstance: OverlayInstance, private $document: IDocumentService, private $uibModalStack: IModalStackService, private storyLine: StoryLine) {

    if (!storyLine || storyLine.items.length === 0) {
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

    const isFocusInElement = (event: JQueryEventObject, element: HTMLElement) => (event.target || event.srcElement) === element;

    const loadFocusableElementList = (story: Story) => {

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

    function stopEvent(event: JQueryEventObject) {
      event.preventDefault();
      event.stopPropagation();
    }

    const manageFocus = (event: JQueryEventObject, story: Story) => {
      const focusableElements = loadFocusableElementList(story);

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
          if (isFocusInElement(event, firstElement)) {
            if (!story.cannotMoveBack) {
              $scope.$apply(() => this.previousItem());
            }
            stopEvent(event);
          }
        } else {
          if (isFocusInElement(event, lastElement)) {
            if (!isClick(story.nextCondition) && this.popoverController.isValid()) {
              $scope.$apply(() => this.nextItem());
            } else {
              firstElement.focus();
            }
            stopEvent(event);
          }
        }

        // prevent input focus breaking from story focusable area
        if (!activeElementIsFocusable()) {
          firstElement.focus();
          stopEvent(event);
        }

      } else {
        stopEvent(event);
      }
    };

    const manageNextClick = (currentStory: Story) => {

      const nextCondition = currentStory.nextCondition;

      if (nextCondition.type === 'modifying-click') {

        let tryCount = 0;

        const waitForElementToDisappear = () => {

          if (tryCount > 30) {
            // reset values to state as before wait
            $scope.$apply(() => {
              this.styleSetState.waitingForItemToChange = false;
              this.backdrop = this.calculateBackdrop(InteractiveHelpController.calculateFocus(currentStory));
              this.popoverOffset = this.popoverController.calculateOffset();
            });
            return;
          }

          if (elementExists(nextCondition.element())) {
            tryCount++;
            setTimeout(waitForElementToDisappear, 50);
          } else {
            this.styleSetState.waitingForItemToChange = false;
            $scope.$apply(() => this.nextItem());
          }
        };

        waitForElementToDisappear();

        // if next not already applied
        if (tryCount > 0) {
          $scope.$apply(() => this.waitForItemChange(this.peekNext()));
        }

      } else {
        $scope.$apply(() => this.nextItem());
      }
    };

    const keyDownListener = (event: JQueryEventObject) => {

      const item = this.currentItem();

      switch (event.which) {
        case tab:
          if (item.type === 'story') {
            manageFocus(event, item);
          }
          break;
        case esc:
          $scope.$apply(() => this.close(true));
          break;
      }
    };

    const clickListener = (event: JQueryEventObject) => {
      const item = this.currentItem();

      if (item && item.type === 'story' && isClick(item.nextCondition)) {
        const continueToNextElement = item.nextCondition.element();

        if (elementExists(continueToNextElement)) {
          if (isTargetElementInsideElement(event, continueToNextElement[0])) {
            manageNextClick(item);
          }
        } else if (item.nextCondition.type === 'modifying-click') {
          manageNextClick(item);
        } else {
          throw new Error('Popover element not found');
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


    const storyFocus = () => {
      const item = this.currentItem();
      return item.type === 'story' ? InteractiveHelpController.calculateFocus(item) : null;
    };

    const storyPopoverOffset = () => {
      const item = this.currentItem();
      return item.type === 'story' && item.popoverTo().offset();
    };

    const ifChangeNotInProgress = <T> (cb: (newItem: T, oldItem: T) => any) => {
      return (newItem: T, oldItem: T) => {
        if (!this.styleSetState.waitingForItemToChange) {
          return cb(newItem, oldItem);
        }
      };
    };

    $scope.$watch<Positioning|null>(storyFocus, ifChangeNotInProgress<Positioning|null>(this.calculateBackdrop.bind(this)), true);
    $scope.$watch(storyPopoverOffset, ifChangeNotInProgress(this.setItemStyles.bind(this)), true);

    $scope.$watch(() => this.popoverController.item, () => this.setItemStyles());

    const setItemStylesApplyingScope = () => $scope.$apply(() => this.setItemStyles());

    window.addEventListener('resize', setItemStylesApplyingScope);
    window.addEventListener('scroll', setItemStylesApplyingScope);

    $scope.$on('$destroy', () => {
      window.removeEventListener('resize', setItemStylesApplyingScope);
      window.removeEventListener('scroll', setItemStylesApplyingScope);
    });
  }

  popoverStyle() {
    return this.popoverOffset ? this.popoverOffset : { visibility: 'hidden' };
  }

  register(popover: HelpPopoverController) {
    this.popoverController = popover;
    this.showItem(this.activeIndex);
  }

  private waitForItemChange(nextItem: Story|Notification|null) {

    this.styleSetState.waitingForItemToChange = true;
    this.popoverController.hide();

    if (nextItem && (nextItem.type === 'notification' || nextItem.focusTo)) {
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
      width: Math.trunc(focusTo.element.outerWidth(false)) + marginLeft + marginRight,
      height: Math.trunc(focusTo.element.outerHeight(false)) + marginTop + marginBottom,
      left: Math.trunc(focusToElementOffset.left) - marginLeft,
      top: Math.trunc(focusToElementOffset.top) - marginTop
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

  private setItemStyles() {

    const state = this.styleSetState;
    const item = this.currentItem();

    const debounce = () => {
      state.offsetStabileCheck = this.popoverController.calculateOffset();

      if (state.debounceHandle) {
        state.debounceCount++;
        clearTimeout(state.debounceHandle);
      }

      if (state.debounceCount > 100) {
        console.log(item);
        throw new Error('Element not exist or does not stabilize');
      }

      state.debounceHandle = setTimeout(applyPositioningAndFocusWhenStabile, 20);
    };

    const applyPositioningAndFocusWhenStabile = () => {

      let offset = this.popoverController.calculateOffset();

      if (offset && state.offsetStabileCheck && offset.left === state.offsetStabileCheck.left && offset.top === state.offsetStabileCheck.top) {

        if (item.type === 'story') {
          item.popoverTo().find(focusableSelector).addBack(focusableSelector).focus();
        }

        if (!state.animating) {
          const scrollElement = this.$uibModalStack.getTop() ? this.$uibModalStack.getTop().value.modalDomEl.find('.modal-content') : 'html, body';
          const scrollTo = item.type === 'story' ? offset.top - 100 : 0;
          angular.element(scrollElement).animate({ scrollTop: scrollTo }, 100);
          state.animating = true;
          debounce();
        } else {
          this.$scope.$apply(() => {
            this.styleSetState.waitingForItemToChange = false;
            this.popoverOffset = offset;

            if (item.type === 'story') {
              this.backdrop = this.calculateBackdrop(InteractiveHelpController.calculateFocus(item));
            }
          });
        }
      } else {
        debounce();
      }
    };

    if (state.waitingForItemToChange) {
      return;
    }

    this.waitForItemChange(item);

    state.debounceCount = 0;
    state.animating = false;

    debounce();
  }

  peekNext(): Story|Notification|null {
    if (this.isCurrentLastItem()) {
      return null;
    } else {
      return this.storyLine.items[this.activeIndex + 1];
    }
  }

  nextItem() {
    if (this.isCurrentLastItem()) {
      this.close(false);
    } else {
      this.showItem(++this.activeIndex);
    }
  }

  previousItem() {
    if (this.isCurrentFirstItem()) {
      this.close(true);
    } else {
      this.showItem(--this.activeIndex);
    }
  }

  isFirstItem(index: number) {
    return index === 0;
  }

  isLastItem(index: number) {
    return index === this.storyLine.items.length - 1;
  }

  isCurrentFirstItem() {
    return this.isFirstItem(this.activeIndex);
  }

  isCurrentLastItem() {
    return this.isLastItem(this.activeIndex);
  }

  showItem(index: number) {
    const item = this.storyLine.items[index];
    this.popoverController.show(item, this.isFirstItem(index), this.isLastItem(index));
  }

  currentItem() {
    return this.storyLine.items[this.activeIndex];
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
          <h3>{{ctrl.item.title | translate}}</h3>
          <p>{{ctrl.item.content | translate}}</p>
          <button ng-show="ctrl.showPrevious" ng-click="ctrl.previous()" class="small button help-navigate" translate>previous</button>
          <button ng-show="ctrl.showNext" ng-disabled="!ctrl.isValid()" ng-click="ctrl.next()" class="small button help-navigate" translate>next</button>
          <button ng-show="ctrl.showClose" ng-disabled="!ctrl.isValid()" ng-click="ctrl.close(false)" class="small button help-next" translate>close</button>
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

  item: Story|Notification;
  arrowClass: string[] = [];
  showNext: boolean;
  showPrevious: boolean;
  showClose: boolean;
  ngModel: INgModelController|null;

  constructor(private $element: JQuery, private $document: IDocumentService) {
    this.helpController.register(this);
  }

  isValid() {
    return !this.ngModel || this.ngModel.$valid;
  }

  show(item: Story|Notification, first: boolean, last: boolean) {
    this.item = item;

    if (item.type === 'story') {
      this.arrowClass = ['help-arrow', `help-${item.popoverPosition}`];
      this.showNext = !last && !isClick(item.nextCondition);
      this.showClose = last && !isClick(item.nextCondition);
      this.showPrevious = !first && !item.cannotMoveBack;

      if (item.nextCondition.type === 'valid-input') {
        this.ngModel = item.nextCondition.element().find('[ng-model]').addBack('[ng-model]').controller('ngModel');
      }

      if ((item.nextCondition.type === 'valid-input' || item.initialInputValue) && !this.ngModel) {
        throw new Error('ng-model does not exits for popover element');
      }

      if (item.initialInputValue && !this.ngModel!.$viewValue) {
        this.ngModel!.$setViewValue(item.initialInputValue);
        this.ngModel!.$render();
      }
    } else {
      this.arrowClass = [];
      this.showNext = !last;
      this.showClose = last;
      this.showPrevious = !first && !item.cannotMoveBack;
      this.ngModel = null;
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
    this.helpController.nextItem();
  }

  previous() {
    this.helpController.previousItem();
  }

  calculateOffset(): Positioning|null {

    const popoverWidth = this.$element.width();
    const popoverHeight = this.$element.height();

    // center notification
    if (this.item.type === 'notification') {
      return { top: window.innerHeight / 2 - popoverHeight / 2, left: window.innerWidth / 2 - popoverWidth / 2 };
    }

    const element = this.item.popoverTo();
    const position = this.item.popoverPosition;

    if (!element || element.length === 0) {
      return null;
    }

    const left = element.offset().left;
    const top = element.offset().top;
    const width = element.prop('offsetWidth');
    const height = element.prop('offsetHeight');
    const arrow = 13;
    const documentWidth = angular.element(this.$document).width();

    switch (position) {
      case 'left':
        const leftPopoverLeft = left - popoverWidth - arrow;
        const leftWidthOffScreen = leftPopoverLeft < 0 ? -leftPopoverLeft : 0;

        if (leftWidthOffScreen) {
          return { top: top, left: leftPopoverLeft + leftWidthOffScreen, width: popoverWidth - leftWidthOffScreen };
        } else {
          return { top: top, left: leftPopoverLeft };
        }
      case 'right':
        const rightPopoverLeft = left + width + arrow;
        const rightPopoverRight = documentWidth - (rightPopoverLeft + popoverWidth);
        const rightWidthOffScreen = rightPopoverRight < 0 ? -rightPopoverRight : 0;

        if (rightWidthOffScreen) {
          return { top: top, left: rightPopoverLeft, width: popoverWidth - rightWidthOffScreen };
        } else {
          return { top: top, left: rightPopoverLeft };
        }
      case 'top':
        const topPopoverRight = documentWidth - (left + popoverWidth);
        const topWidthOffScreen = topPopoverRight < 0 ? -topPopoverRight : 0;

        if (topWidthOffScreen) {
          return {top: top - popoverHeight - arrow, left: left, width: popoverWidth - topWidthOffScreen };
        } else {
          return {top: top - popoverHeight - arrow, left: left};
        }
      case 'bottom':
        const bottomPopoverRight = documentWidth - (left + popoverWidth);
        const bottomWidthOffScreen = bottomPopoverRight < 0 ? -bottomPopoverRight : 0;

        if (bottomWidthOffScreen) {
          return { top: top + height + arrow, left: left, width: popoverWidth - bottomWidthOffScreen };
        } else {
          return { top: top + height + arrow, left: left };
        }
      default:
        return assertNever(position);
    }
  }
}
