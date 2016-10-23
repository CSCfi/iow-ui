import { module as mod } from './module';
import { OverlayService, OverlayInstance } from './overlay';
import { IScope, IDocumentService, ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import { assertNever, requireDefined, areEqual } from '../../utils/object';
import { tab, esc } from '../../utils/keyCode';
import { isTargetElementInsideElement, nextUrl } from '../../utils/angular';
import { InteractiveHelpService } from '../../help/services/interactiveHelpService';
import {
  StoryLine, NextCondition, Story, Notification, Click, ModifyingClick,
  NavigatingClick
} from '../../help/contract';
import { contains } from '../../utils/array';

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
          <help-popover item="ctrl.item" help-controller="ctrl" ng-style="ctrl.popoverController.style()" ng-class="ctrl.popoverController.class()"></help-popover>
          <help-backdrop item="ctrl.item" help-controller="ctrl"></help-backdrop>
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


class InteractiveHelpController {

  item: Story|Notification;
  activeIndex = 0;
  changingLocation = false;

  popoverController: HelpPopoverController;
  backdropController: HelpBackdropController;

  /* @ngInject */
  constructor(private $scope: IScope,
              private $overlayInstance: OverlayInstance,
              $document: IDocumentService,
              $location: ILocationService,
              private storyLine: StoryLine) {

    if (!storyLine || storyLine.items.length === 0) {
      throw new Error('No stories defined');
    }

    this.showItem(0);

    // Active element needs to be blurred because it can used for example for multiple interactive help activations
    angular.element(document.activeElement).blur();

    const keyDownHandler = this.keyDownHandler.bind(this);
    const clickHandler = this.clickHandler.bind(this);

    // Lazy initialization of listeners so that it doesn't intervene with help opening event
    window.setTimeout(() => {
      $document.on('keydown', keyDownHandler);
      $document.on('click', clickHandler);
    });

    $scope.$on('$destroy', () => {
      $document.off('keydown', keyDownHandler);
      $document.off('click', clickHandler);
    });

    let continuing = false;

    $scope.$on('$locationChangeStart', (event, next) => {

      if (!continuing) {
        event.preventDefault();

        // delay is needed so that click handler has time to modify flag
        setTimeout(() => {
          if (this.changingLocation) {
            continuing = true;
            $location.url(nextUrl($location, next));
            this.moveToNextItem();
          } else {
            this.close(true);
          }
        });
      } else {
        continuing = false;
      }
    });
  }

  loadFocusableElementList() {

    const item = this.item;

    if (item.type === 'notification' || !item.focusTo) {
      return [];
    }

    const focusableElements = item.focusTo.element().find(focusableSelector).addBack(focusableSelector);
    const result: HTMLElement[] = [];

    focusableElements.each((_index: number, element: HTMLElement) => {
      if (isVisible(element) && (!element.tabIndex || element.tabIndex > 0)) {
        result.push(element);
      }
    });

    return result;
  };

  manageTabKeyFocus(event: JQueryEventObject) {

    const item = this.item;
    const focusableElements = this.loadFocusableElementList();

    const activeElementIsFocusable = () => {
      for (const focusableElement of focusableElements) {
        if (focusableElement === document.activeElement) {
          return true;
        }
      }
      return false;
    };

    if (item.type === 'story' && focusableElements.length > 0) {

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (isFocusInElement(event, firstElement)) {
          if (!item.cannotMoveBack) {
            this.$scope.$apply(() => this.moveToPreviousItem());
          }
          stopEvent(event);
        }
      } else {
        if (isFocusInElement(event, lastElement)) {
          if (!isClick(item.nextCondition) && this.isValid()) {
            this.$scope.$apply(() => this.moveToNextItem());
          } else {
            firstElement.focus();
          }
          stopEvent(event);
        }
      }

      // prevent input focus breaking from item focusable area
      if (!activeElementIsFocusable()) {
        firstElement.focus();
        stopEvent(event);
      }

    } else {
      stopEvent(event);
    }
  };

  keyDownHandler(event: JQueryEventObject) {
    switch (event.which) {
      case tab:
        this.manageTabKeyFocus(event);
        break;
      case esc:
        this.$scope.$apply(() => this.close(true));
        break;
    }
  }

  moveToNextItemAfterElementDisappeared(element: () => JQuery) {

    let tryCount = 0;

    const waitForElementToDisappear = () => {

      if (elementExists(element())) {
        if (++tryCount < 100) {
          setTimeout(waitForElementToDisappear, 10);
        }
      } else {
        this.$scope.$apply(() => this.moveToNextItem());
      }
    };

    waitForElementToDisappear();
  }

  markLocationChange() {
    this.changingLocation = true;
    setTimeout(() => this.changingLocation = false, 500);
  }

  clickHandler(event: JQueryEventObject) {
    const item = this.item;

    if (item.type === 'story' && isClick(item.nextCondition) && this.isValid()) {
      const continueToNextElement = item.nextCondition.element();

      if (elementExists(continueToNextElement)) {
        if (isTargetElementInsideElement(event, continueToNextElement[0])) {
          if (item.nextCondition.type === 'modifying-click') {
            this.moveToNextItemAfterElementDisappeared(item.nextCondition.element);
          } else if (item.nextCondition.type === 'navigating-click') {
            this.markLocationChange();
          } else {
            this.$scope.$apply(() => this.moveToNextItem());
          }
        }
      } else if (item.nextCondition.type === 'modifying-click') {
        this.$scope.$apply(() => this.moveToNextItem());
      } else if (item.nextCondition.type === 'navigating-click') {
        this.markLocationChange();
      } else {
        throw new Error('Next condition element not found');
      }
    }
  }

  registerPopover(popover: HelpPopoverController) {
    this.popoverController = popover;
  }

  registerBackdrop(backdrop: HelpBackdropController) {
    this.backdropController = backdrop;
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
    InteractiveHelpController.initializeItem(this.item);
  }

  private static initializeItem(item: Story|Notification) {
    if (item.type === 'story' && item.initialInputValue) {

      const initialInputNgModel = item.initialInputValue.element().controller('ngModel');

      if (!initialInputNgModel) {
        throw new Error('ng-model does not exits for initial input');
      } else {
        if (!initialInputNgModel.$viewValue) {
          initialInputNgModel.$setViewValue(item.initialInputValue.value);
          initialInputNgModel.$render();
        }
      }
    }
  }

  get validationNgModel() {
    const item = this.item;

    if (item.type !== 'story' || item.nextCondition.type !== 'valid-input') {
      throw new Error('No ng-model for current item');
    }

    return item.nextCondition.element().controller('ngModel');
  }

  isValid() {
    switch (this.item.type) {
      case 'story':
        switch (this.item.nextCondition.type) {
          case 'explicit':
          case 'click':
          case 'navigating-click':
          case 'modifying-click':
            return true;
          case 'valid-input':
            return this.validationNgModel.$valid && !this.validationNgModel.$pending;
          case 'element-exists':
            const element = this.item.nextCondition.element();
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

  moveToNextItem() {
    if (this.isCurrentLastItem()) {
      this.close(false);
    } else {
      this.showItem(++this.activeIndex);
    }
  }

  moveToPreviousItem() {
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
  animate = false;

  debounceHandle: any;
  debounceCount = 0;

  constructor(private $scope: IScope, private $element: JQuery, private $document: IDocumentService, private $uibModalStack: IModalStackService) {

    this.helpController.registerPopover(this);

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

        this.updatePositioningAfterStabile();
      }
    };

    const storyPopoverPositioning = () => this.item && this.item.type === 'story' && elementPositioning(this.item.popoverTo());

    $scope.$watch(() => this.item, () => {
      if (this.positioning) {
        // item change will change content and this forces width recalculation
        this.positioning.width = undefined;
      }
      setItemStyles();
    });

    $scope.$watch(() => elementPositioning($element), (newPositioning, oldPositioning) => {

      // shift animation starting point without animating no make popover transition smoother
      if (oldPositioning && newPositioning && this.positioning && this.item.type === 'story') {
        // item not moved
        if (oldPositioning.left === newPositioning.left && oldPositioning.top === newPositioning.top) {

          switch (this.item.popoverPosition) {
            case 'left':
              if (oldPositioning.width !== newPositioning.width) {
                // shift location
                this.animate = false;
                this.positioning.left -= (newPositioning.width - oldPositioning.width);
              }
              break;
            case 'top':
              if (oldPositioning.height !== newPositioning.height) {
                // shift location
                this.animate = false;
                this.positioning.top -= (newPositioning.height - oldPositioning.height);
              }
              break;
            case 'right':
            case 'bottom':
              // nop
              break;
            default:
              assertNever(this.item.popoverPosition, 'Unsupported popover position');
          }
        }
      }
    }, true);

    $scope.$watch(storyPopoverPositioning, setItemStyles, true);

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

  private updatePositioningAfterStabile() {

    const debounce = (resetCounter: boolean) => {

      if (resetCounter) {
        this.debounceCount = 0;
      }

      if (this.debounceHandle) {
        this.debounceCount++;
        clearTimeout(this.debounceHandle);
      }

      if (this.debounceCount > 40) {
        throw new Error('Element not exist or does not stabilize');
      }

      this.debounceHandle = setTimeout(applyPositioningAndScrollWhenStabile, 50);
    };

    const applyPositioningAndScrollWhenStabile = () => {
      if (this.isPositioningStabile()) {
        this.debounceHandle = null;
        this.$scope.$apply(() => {
          this.animate = true;
          this.scrollTo();
        });
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

  scrollTo() {
    const scrollElement = this.$uibModalStack.getTop() ? this.$uibModalStack.getTop().value.modalDomEl.find('.modal-content') : 'html, body';
    const scrollTo = requireDefined(this.item).type === 'story' && this.positioning ? this.positioning.top - 100 : 0;
    angular.element(scrollElement).animate({ scrollTop: scrollTo }, 100);
  }

  close(cancel: boolean) {
    this.helpController.close(cancel);
  }

  next() {
    this.helpController.moveToNextItem();
  }

  previous() {
    this.helpController.moveToPreviousItem();
  }

  style() {
    return this.positioning;
  }

  class() {
    return { animate: this.animate };
  }

  isPositioningStabile() {
    return positioningsAreEqual(this.positioning, this.calculatePositioning());
  }

  updatePositioning() {
    const positioning = this.calculatePositioning();

    if (positioning) {
      this.positioning = this.calculatePositioning();
    }
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
    return this.calculateCenterPositioning();
  }

  private calculateCenterPositioning() {
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
    const { left, top, width, height } = elementPositioning(element)!;

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

mod.directive('helpBackdrop', () => {
  return {
    restrict: 'E',
    template: `
        <div ng-show="ctrl.regions" class="help-backdrop" ng-style="ctrl.regions.top"></div>
        <div ng-show="ctrl.regions" class="help-backdrop" ng-style="ctrl.regions.right"></div>
        <div ng-show="ctrl.regions" class="help-backdrop" ng-style="ctrl.regions.bottom"></div>
        <div ng-show="ctrl.regions" class="help-backdrop" ng-style="ctrl.regions.left"></div>
    `,
    bindToController: true,
    scope: {
      item: '<',
      helpController: '<'
    },
    controller: HelpBackdropController,
    controllerAs: 'ctrl'
  };
});

class HelpBackdropController {

  item: Story|Notification;
  regions: Regions | null;

  helpController: InteractiveHelpController;

  constructor($scope: IScope, private $document: IDocumentService) {

    this.helpController.registerBackdrop(this);

    const storyFocus = () => {
      const item = requireDefined(this.item);
      return item.type === 'story' ? HelpBackdropController.calculateFocusPositioning(item) : null;
    };

    $scope.$watch(storyFocus, () => this.updatePositioning(), true);
    const setBackDropApplyingScope = () => $scope.$apply(() => this.updatePositioning());

    window.addEventListener('resize', setBackDropApplyingScope);
    window.addEventListener('scroll', setBackDropApplyingScope);

    $scope.$on('$destroy', () => {
      window.removeEventListener('resize', setBackDropApplyingScope);
      window.removeEventListener('scroll', setBackDropApplyingScope);
    });
  }

  updatePositioning() {

    const regionPositionings  = this.resolveRegions();

    if (!regionsAreEqual(this.regions, regionPositionings)) {

      // Do off digest
      setTimeout(() => this.focusFirstFocusable());

      this.regions = regionPositionings;
    }
  }

  // XXX: does this logic belong to here?
  private focusFirstFocusable() {
    if (this.item && this.item.type === 'story' && this.item.focusTo) {

      const focusable = this.item.focusTo.element().find(focusableSelector).addBack(focusableSelector).eq(0);

      focusable.focus();

      if (contains(['INPUT', 'TEXTAREA'], focusable.prop('tagName'))) {
        const valueLength = focusable.val().length;
        // ensures that cursor will be at the end of the input
        setTimeout(() => (focusable[0] as HTMLInputElement).setSelectionRange(valueLength, valueLength));
      }
    }
  }

  private resolveRegions(): Regions|null {

    const fullBackdrop = {
      top: { left: 0, top: 0, right: 0, bottom: 0 },
      right: { left: 0, top: 0, width: 0, height: 0 },
      bottom: { left: 0, top: 0, width: 0, height: 0 },
      left: { left: 0, top: 0, width: 0, height: 0 }
    };

    if (!this.item) {
      return null;
    } else {
      switch (this.item.type) {
        case 'story':
          return this.calculateRegions(this.item);
        case 'notification':
          return fullBackdrop;
        default:
          return assertNever(this.item, 'Unknown item type');
      }
    }
  }

  private calculateRegions(story: Story): Regions|null {

    const positioning = HelpBackdropController.calculateFocusPositioning(story);

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

  private static calculateFocusPositioning(story: Story): Positioning|null {

    if (!story || !story.focusTo) {
      return null;
    }

    const focusTo = story.focusTo;
    const focusToElementPositioning = elementPositioning(story.focusTo.element())!;

    if (!focusToElementPositioning) {
      return null;
    }

    const marginTop = focusTo.margin && focusTo.margin.top || 0;
    const marginRight = focusTo.margin && focusTo.margin.right || 0;
    const marginBottom = focusTo.margin && focusTo.margin.bottom || 0;
    const marginLeft = focusTo.margin && focusTo.margin.left || 0;

    return {
      width: Math.trunc(focusToElementPositioning.width) + marginLeft + marginRight,
      height: Math.trunc(focusToElementPositioning.height) + marginTop + marginBottom,
      left: Math.trunc(focusToElementPositioning.left) - marginLeft,
      top: Math.trunc(focusToElementPositioning.top) - marginTop
    };
  }
}

function elementPositioning(element: JQuery) {

  if (!element || element.length === 0) {
    return null;
  }

  const offset = element.offset();
  const width = element.prop('offsetWidth');
  const height = element.prop('offsetHeight');

  return {
    left: offset.left,
    top: offset.top,
    width,
    height
  };
}

function isVisible(element: HTMLElement) {
  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}

function elementExists(e: JQuery) {
  return e && e.length > 0 && isVisible(e[0]);
}

function isClick(nextCondition: NextCondition): nextCondition is Click|ModifyingClick|NavigatingClick {
  return contains(['click', 'navigating-click', 'modifying-click'], nextCondition.type);
}

function isFocusInElement(event: JQueryEventObject, element: HTMLElement) {
  return (event.target || event.srcElement) === element;
}

function stopEvent(event: JQueryEventObject) {
  event.preventDefault();
  event.stopPropagation();
}

interface Positioning {
  left: number;
  top: number;
  width?: number;
  height?: number;
  right?: number;
  bottom?: number;
}

function positioningsAreEqual(lhs: Positioning|null, rhs: Positioning|null): boolean {
  return areEqual(lhs, rhs, (l: Positioning, r: Positioning) =>
    l.left === r.left
    && l.top === r.top
    && l.width === r.width
    && l.height === r.height
    && l.right === r.right
    && l.bottom === r.bottom
  );
}

interface Regions {
  top: Positioning;
  right: Positioning;
  bottom: Positioning;
  left: Positioning;
}

function regionsAreEqual(lhs: Regions|null, rhs: Regions|null): boolean {
  return areEqual(lhs, rhs, (l, r) => (
    positioningsAreEqual(l.top, r.top)
    && positioningsAreEqual(l.right, r.right)
    && positioningsAreEqual(l.bottom, r.bottom)
    && positioningsAreEqual(l.left, r.left)
  ));
}
