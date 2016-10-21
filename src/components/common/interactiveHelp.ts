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

  item: Story|Notification;
  popoverController: HelpPopoverController;
  activeIndex = 0;
  backdrop: { top: Positioning, right: Positioning, bottom: Positioning, left: Positioning } | null;
  validationNgModel: INgModelController|null;

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

    const keyDownListener = (event: JQueryEventObject) => {

      const item = requireDefined(this.item);

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

    const moveToNextItemAfterElementDisappeared = (element: () => JQuery) => {

      let tryCount = 0;

      const waitForElementToDisappear = () => {

        if (tryCount > 30) {
          // reset values to state as before wait
          $scope.$apply(() => {
            this.popoverController.show(false);
            this.popoverController.updatePositioning();
            this.updateBackdrop();
          });
          return;
        }

        if (elementExists(element())) {
          tryCount++;
          setTimeout(waitForElementToDisappear, 20);
        } else {
          $scope.$apply(() => this.nextItem());
        }
      };

      waitForElementToDisappear();

      // if next not already applied
      if (tryCount > 0) {
        $scope.$apply(() => {
          this.popoverController.hide();
          this.updateBackdrop(true);
        });
      }
    };

    const clickListener = (event: JQueryEventObject) => {
      const item = this.item;

      if (item.type === 'story' && isClick(item.nextCondition) && this.isValid()) {
        const continueToNextElement = item.nextCondition.element();

        if (elementExists(continueToNextElement)) {
          if (isTargetElementInsideElement(event, continueToNextElement[0])) {
            $scope.$apply(() => this.nextItem());
          }
        } else if (item.nextCondition.type === 'modifying-click') {
          moveToNextItemAfterElementDisappeared(item.nextCondition.element);
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
      const item = requireDefined(this.item);
      return item.type === 'story' ? InteractiveHelpController.calculateFocus(item) : null;
    };

    $scope.$watch(storyFocus, () => this.updateBackdrop(), true);
    const setBackDropApplyingScope = () => $scope.$apply(() => this.updateBackdrop());

    window.addEventListener('resize', setBackDropApplyingScope);
    window.addEventListener('scroll', setBackDropApplyingScope);

    $scope.$on('$destroy', () => {
      window.removeEventListener('resize', setBackDropApplyingScope);
      window.removeEventListener('scroll', setBackDropApplyingScope);
    });
  }

  register(popover: HelpPopoverController) {
    this.popoverController = popover;
  }

  private updateBackdrop(next = false) {

    const fullBackdrop = {
      top: { left: 0, top: 0, right: 0, bottom: 0 },
      right: { left: 0, top: 0, width: 0, height: 0 },
      bottom: { left: 0, top: 0, width: 0, height: 0 },
      left: { left: 0, top: 0, width: 0, height: 0 }
    };

    if (next) {
      const nextItem = this.peekNext();
      const nextItemHasFocus = nextItem && (nextItem.type === 'notification' || nextItem.focusTo);

      if (nextItemHasFocus) {
        this.backdrop = fullBackdrop;
      } else {
        this.backdrop = null;
      }
    } else {
      if (!this.item) {
        this.backdrop = null;
      } else {
        switch (this.item.type) {
          case 'story':
            this.backdrop = this.calculateBackdrop(this.item);
            break;
          case 'notification':
            this.backdrop = fullBackdrop;
            break;
          default:
            assertNever(this.item, 'Unknown item type');
        }
      }
    }
  }

  private calculateBackdrop(story: Story) {

    const positioning = InteractiveHelpController.calculateFocus(story);

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

  private static calculateFocus(story: Story): Positioning|null {

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

  canMoveToNext() {
    return true;
  }

  canMoveToPrevious() {
    return !this.isCurrentFirstItem() && !this.item.cannotMoveBack;
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
    switch (this.item.type) {
      case 'story':
        switch (this.item.nextCondition.type) {
          case 'explicit':
          case 'click':
          case 'modifying-click':
            return true;
          case 'valid-input':
            return this.validationNgModel && this.validationNgModel.$valid && !this.validationNgModel.$pending;
          case 'element-exists':
            const element = this.item.nextCondition.element();
            console.log(element);
            return element && element.length > 0;
          default:
            return assertNever(this.item.nextCondition, 'Unknown next condition');
        }
      case 'notification':
        return true;
      default:
        return assertNever(this.item, 'Unknown item type');
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

  isCurrentFirstItem() {
    return this.activeIndex === 0;
  }

  isCurrentLastItem() {
    return this.activeIndex === this.storyLine.items.length - 1;
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
      item: '<',
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

  positioning: Positioning|null = null;
  hidden = false;

  debounceHandle: any;
  debounceCount = 0;

  constructor(private $scope: IScope, private $element: JQuery, private $document: IDocumentService, private $uibModalStack: IModalStackService) {

    this.helpController.register(this);

    const setItemStyles = () => {

      const item = this.item;

      if (item) {
        switch (item.type) {
          case 'story':
            this.arrowClass = ['help-arrow', `help-${item.popoverPosition}`];
            break;
          case 'notification':
            this.arrowClass = [];
            break;
          default:
            assertNever(item, 'Unknown item type');
        }

        this.setOffsetAndShowWhenStabile();
      }
    };

    const storyPopoverOffset = () => this.item && this.item.type === 'story' && this.item.popoverTo().offset();

    $scope.$watch(() => this.item, () => {
      this.hide();
      setItemStyles();
    });
    $scope.$watch(storyPopoverOffset, setItemStyles, true);

    window.addEventListener('resize', setItemStyles);
    window.addEventListener('scroll', setItemStyles);

    $scope.$on('$destroy', () => {
      window.removeEventListener('resize', setItemStyles);
      window.removeEventListener('scroll', setItemStyles);
    });
  }

  get showNext() {
    return this.helpController.canMoveToNext()
      && !this.helpController.isCurrentLastItem()
      && (this.item.type === 'notification' || !isClick(this.item.nextCondition));
  }

  get showClose() {
    return this.helpController.canMoveToNext()
      && this.helpController.isCurrentLastItem()
      && (this.item.type === 'notification' || !isClick(this.item.nextCondition));
  }

  get showPrevious() {
    return this.helpController.canMoveToPrevious();
  }

  private setOffsetAndShowWhenStabile() {

    const debounce = (resetCounter: boolean) => {

      if (resetCounter) {
        this.debounceCount = 0;
      }

      if (this.debounceHandle) {
        this.debounceCount++;
        clearTimeout(this.debounceHandle);
      }

      if (this.debounceCount > 100) {
        throw new Error('Element not exist or does not stabilize');
      }

      this.debounceHandle = setTimeout(applyPositioningAndFocusWhenStabile, 20);
    };

    const applyPositioningAndFocusWhenStabile = () => {
      if (this.isPositioningStabile()) {
        this.debounceHandle = null;

        // XXX: does this logic belong to here?
        if (this.item && this.item.type === 'story') {
          this.item.popoverTo().find(focusableSelector).addBack(focusableSelector).focus();
        }

        this.$scope.$apply(() => this.show(true));
      } else {
        this.updatePositioning();
        debounce(false);
      }
    };

    debounce(true);
  }

  isValid() {
    return this.helpController.isValid();
  }

  hide() {
    this.hidden = true;
  }

  show(scrollTo: boolean) {
    this.hidden = false;

    if (scrollTo) {
      setTimeout(() => this.scrollTo());
    }
  }

  scrollTo() {
    const scrollElement = this.$uibModalStack.getTop() ? this.$uibModalStack.getTop().value.modalDomEl.find('.modal-content') : 'html, body';
    const scrollTo = requireDefined(this.item).type === 'story' ? requireDefined(this.positioning).top - 100 : 0;
    angular.element(scrollElement).animate({ scrollTop: scrollTo }, 100);
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
    return this.hidden ? { visibility: 'hidden' } : this.positioning;
  }

  isPositioningStabile() {
    const positioning = this.calculatePositioning();

    return positioning && this.positioning
      && positioning.left === this.positioning.left
      && positioning.top === this.positioning.top
      && positioning.width === this.positioning.width
      && positioning.height === this.positioning.height
      && positioning.right === this.positioning.right
      && positioning.bottom === this.positioning.bottom;
  }

  updatePositioning() {
    this.positioning = this.calculatePositioning();
  }

  private calculatePositioning(): Positioning|null {

    if (!this.item) {
      return null;
    }

    switch (this.item.type) {
      case 'story':
        return this.calculateStoryPositioning(this.item);
      case 'notification':
        return this.calculateNotificationPositioning(this.item);
      default:
        return assertNever(this.item, 'Unknown item type');
    }
  }

  private calculateNotificationPositioning(_notification: Notification): Positioning {
    return {
      top: window.innerHeight / 2 - this.$element.height() / 2,
      left: window.innerWidth / 2 - this.$element.width() / 2
    };
  }

  private calculateStoryPositioning(story: Story): Positioning|null {

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
        return { top: top, left: leftPopoverLeft + leftWidthOffScreen, width: popoverWidth - leftWidthOffScreen };
      case 'right':
        const rightPopoverLeft = left + width + arrow;
        const rightPopoverRight = documentWidth - (rightPopoverLeft + popoverWidth);
        const rightWidthOffScreen = rightPopoverRight < 0 ? -rightPopoverRight : 0;
        return { top: top, left: rightPopoverLeft, width: popoverWidth - rightWidthOffScreen };
      case 'top':
        const topPopoverRight = documentWidth - (left + popoverWidth);
        const topWidthOffScreen = topPopoverRight < 0 ? -topPopoverRight : 0;
        return {top: top - popoverHeight - arrow, left: left, width: popoverWidth - topWidthOffScreen };
      case 'bottom':
        const bottomPopoverRight = documentWidth - (left + popoverWidth);
        const bottomWidthOffScreen = bottomPopoverRight < 0 ? -bottomPopoverRight : 0;
        return { top: top + height + arrow, left: left, width: popoverWidth - bottomWidthOffScreen };
      default:
        return assertNever(story.popoverPosition, 'Unsupported popover position');
    }
  }
}
