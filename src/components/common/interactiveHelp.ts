import { module as mod } from './module';
import { OverlayService, OverlayInstance } from './overlay';
import { IScope, IDocumentService, INgModelController, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import { assertNever, requireDefined } from '../../utils/object';
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
  debounceHandle?: any;
  debounceCount: number;
  animating: boolean;
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
          <help-popover item="ctrl.item" help-controller="ctrl" ng-style="ctrl.popoverController.style()"></help-popover>
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

  item: Story|Notification|null;
  popoverController: HelpPopoverController;
  activeIndex = 0;
  backdrop: { top: Positioning, right: Positioning, bottom: Positioning, left: Positioning } | null;
  validationNgModel: INgModelController|null;

  private styleSetState: StyleSetState = {
    debounceCount: 0,
    animating: false
  };

  /* @ngInject */
  constructor(public $scope: IScope, private $overlayInstance: OverlayInstance, private $document: IDocumentService, private storyLine: StoryLine) {

    if (!storyLine || storyLine.items.length === 0) {
      throw new Error('No stories defined');
    }

    this.showItem(0);

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

      const focusableElements = story.focusTo.element().find(focusableSelector).addBack(focusableSelector);
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
            if (!isClick(story.nextCondition) && this.isValid()) {
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
              this.popoverController.show();
              this.backdrop = this.calculateBackdrop(InteractiveHelpController.calculateFocus(currentStory));
              this.popoverController.updateOffset();
            });
            return;
          }

          if (elementExists(nextCondition.element())) {
            tryCount++;
            setTimeout(waitForElementToDisappear, 20);
          } else {
            $scope.$apply(() => {
              this.nextItem();
              this.popoverController.show();
            });
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
        if (!this.popoverController.hidden) {
          return cb(newItem, oldItem);
        }
      };
    };

    const setBackdrop = (positioning: Positioning|null) => {
      this.backdrop = this.calculateBackdrop(positioning);
    };

    $scope.$watch<Positioning|null>(storyFocus, ifChangeNotInProgress(setBackdrop), true);
    $scope.$watch(storyPopoverOffset, ifChangeNotInProgress(this.setItemStyles.bind(this)), true);

    $scope.$watch(() => this.item, () => this.setItemStyles());

    const setItemStylesApplyingScope = () => $scope.$apply(() => this.setItemStyles());

    window.addEventListener('resize', setItemStylesApplyingScope);
    window.addEventListener('scroll', setItemStylesApplyingScope);

    $scope.$on('$destroy', () => {
      window.removeEventListener('resize', setItemStylesApplyingScope);
      window.removeEventListener('scroll', setItemStylesApplyingScope);
    });
  }

  register(popover: HelpPopoverController) {
    this.popoverController = popover;
  }

  private waitForItemChange(nextItem: Story|Notification|null) {

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

    const focusTo = story.focusTo;
    const element = story.focusTo.element();

    if (!element || element.length === 0) {
      return null;
    }

    const focusToElementOffset = element.offset();

    const marginTop = focusTo.margin && focusTo.margin.top || 0;
    const marginRight = focusTo.margin && focusTo.margin.right || 0;
    const marginBottom = focusTo.margin && focusTo.margin.bottom || 0;
    const marginLeft = focusTo.margin && focusTo.margin.left || 0;

    return {
      width: Math.trunc(element.prop('offsetWidth')) + marginLeft + marginRight,
      height: Math.trunc(element.prop('offsetHeight')) + marginTop + marginBottom,
      left: Math.trunc(focusToElementOffset.left) - marginLeft,
      top: Math.trunc(focusToElementOffset.top) - marginTop
    };
  }

  private calculateBackdrop(positioning: Positioning|null) {

    if (!positioning) {
      return null;
    }

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
  }

  private setItemStyles() {

    const state = this.styleSetState;
    const item = this.currentItem();

    const debounce = () => {
      this.popoverController.updateOffset();

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

      if (this.popoverController.isOffsetStabile()) {

        if (item.type === 'story') {
          item.popoverTo().find(focusableSelector).addBack(focusableSelector).focus();
        }

        if (!state.animating) {
          this.popoverController.scrollTo();
          state.animating = true;
          debounce();
        } else {
          this.$scope.$apply(() => {
            this.popoverController.show();

            if (item.type === 'story') {
              this.backdrop = this.calculateBackdrop(InteractiveHelpController.calculateFocus(item));
            }
          });
        }
      } else {
        debounce();
      }
    };

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

  showItem(index: number) {

    this.item = this.storyLine.items[index];

    switch (this.item.type) {
      case 'story':
        this.setStoryParameters(this.item);
        break;
      case 'notification':
        this.setNotificationParameters(this.item);
        break;
      default:
        assertNever(this.item, 'Unsupported item type');
    }
  }

  setStoryParameters(story: Story) {
    if (story.nextCondition.type === 'valid-input') {
      this.validationNgModel = story.nextCondition.element().controller('ngModel');

      if (!this.validationNgModel) {
        throw new Error('ng-model does not exits for valid-input');
      }
    } else {
      this.validationNgModel = null;
    }

    if (story.initialInputValue) {

      const initialInputNgModel = story.initialInputValue.element().controller('ngModel');

      if (!initialInputNgModel) {
        throw new Error('ng-model does not exits for initial input');
      } else {
        if (!initialInputNgModel.$viewValue) {
          initialInputNgModel.$setViewValue(story.initialInputValue.value);
          initialInputNgModel.$render();
        }
      }
    }
  }

  setNotificationParameters(_notification: Notification) {
    this.validationNgModel = null;
  }

  isValid() {
    return !this.validationNgModel || (this.validationNgModel.$valid && !this.validationNgModel.$pending);
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

  isCurrentFirstItem() {
    return this.activeIndex === 0;
  }

  isCurrentLastItem() {
    return this.activeIndex === this.storyLine.items.length - 1;
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
      item: '=',
      helpController: '<'
    },
    controller: HelpPopoverController,
    controllerAs: 'ctrl'
  };
});

class HelpPopoverController {

  helpController: InteractiveHelpController;

  item: Story|Notification|null;
  arrowClass: string[] = [];
  showNext: boolean;
  showPrevious: boolean;
  showClose: boolean;

  offset: { left: number; top: number } | null = null;
  hidden = true;

  constructor($scope: IScope, private $element: JQuery, private $document: IDocumentService, private $uibModalStack: IModalStackService) {
    this.helpController.register(this);

    $scope.$watch(() => this.item, item => {
      if (item) {
        switch (item.type) {
          case 'story':
            this.setStoryStyles(item);
            break;
          case 'notification':
            this.setNotificationStyles(item);
            break;
          default:
            assertNever(item, 'Unknown item type');
        }
      }
    });
  }

  private setStoryStyles(story: Story) {

    this.arrowClass = ['help-arrow', `help-${story.popoverPosition}`];
    this.showNext = !this.helpController.isCurrentLastItem() && !isClick(story.nextCondition);
    this.showClose = this.helpController.isCurrentLastItem() && !isClick(story.nextCondition);
    this.showPrevious = !this.helpController.isCurrentFirstItem() && !story.cannotMoveBack;
  }

  private setNotificationStyles(notification: Notification) {
    this.arrowClass = [];
    this.showNext = !this.helpController.isCurrentLastItem();
    this.showClose = this.helpController.isCurrentLastItem();
    this.showPrevious = !this.helpController.isCurrentFirstItem() && !notification.cannotMoveBack;
  }

  isValid() {
    return this.helpController.isValid();
  }

  hide() {
    this.hidden = true;
  }

  show() {
    this.hidden = false;
  }

  close(cancel: boolean) {
    this.helpController.close(cancel);
  }

  next() {
    this.helpController.nextItem();
  }

  previous() {
    this.helpController.previousItem();
  }

  style() {
    return this.hidden ? { visibility: 'hidden' } : this.offset;
  }

  scrollTo() {
    const scrollElement = this.$uibModalStack.getTop() ? this.$uibModalStack.getTop().value.modalDomEl.find('.modal-content') : 'html, body';
    const scrollTo = requireDefined(this.item).type === 'story' ? requireDefined(this.offset).top - 100 : 0;
    angular.element(scrollElement).animate({ scrollTop: scrollTo }, 100);
  }

  isOffsetStabile() {
    const offset = this.calculateOffset();
    return offset && this.offset && offset.left === this.offset.left && offset.top === this.offset.top;
  }

  updateOffset() {
    this.offset = this.calculateOffset();
  }

  private calculateOffset(): Positioning|null {

    if (!this.item) {
      return null;
    }

    switch (this.item.type) {
      case 'story':
        return this.calculateStoryOffset(this.item);
      case 'notification':
        return this.calculateNotificationOffset(this.item);
      default:
        return assertNever(this.item, 'Unknown item type');
    }
  }

  private calculateNotificationOffset(_notification: Notification): Positioning {
    return {
      top: window.innerHeight / 2 - this.$element.height() / 2,
      left: window.innerWidth / 2 - this.$element.width() / 2
    };
  }

  private calculateStoryOffset(story: Story): Positioning|null {

    const element = story.popoverTo();

    if (!element || element.length === 0) {
      return null;
    }

    const popoverWidth = this.$element.width();
    const popoverHeight = this.$element.height();
    const left = element.offset().left;
    const top = element.offset().top;
    const width = element.prop('offsetWidth');
    const height = element.prop('offsetHeight');
    const arrow = 13;
    const documentWidth = angular.element(this.$document).width();

    // TODO more generic cropping to viewport
    switch (story.popoverPosition) {
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
        return assertNever(story.popoverPosition, 'Unsupported popover position');
    }
  }
}
