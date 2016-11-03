import { module as mod } from '../module';
import * as _ from 'lodash';
import { OverlayService, OverlayInstance } from '../../components/common/overlay';
import { IScope, IPromise, IDocumentService, ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import { assertNever, requireDefined, areEqual, Optional } from '../../utils/object';
import { tab, esc, enter } from '../../utils/keyCode';
import { isTargetElementInsideElement, nextUrl } from '../../utils/angular';
import { InteractiveHelpService } from '../services/interactiveHelpService';
import {
  NextCondition, Story, Notification, Click, ModifyingClick,
  NavigatingClick, InteractiveHelp, createScrollWithDefault
} from '../contract';
import { contains } from '../../utils/array';
import { ConfirmationModal } from '../../components/common/confirmationModal';
import { moveCursorToEnd, scrollToTop } from '../utils';

const popupAnimationTimeInMs = 300; // should match css help-popover transition time
const arrowHeight = 13;

export class InteractiveHelpDisplay {

  /* @ngInject */
  constructor(private overlayService: OverlayService, private interactiveHelpService: InteractiveHelpService) {
  }

  open(help: InteractiveHelp) {

    if (!help || help.storyLine.items.length === 0) {
      throw new Error('No stories defined');
    }

    if (this.interactiveHelpService.isOpen()) {
      throw new Error('Cannot open help when another help is already open');
    }

    const stateInitialization = () => help.onInit ? help.onInit(this.interactiveHelpService) : this.interactiveHelpService.reset().then(() => false);

    this.interactiveHelpService.open();

    return this.overlayService.open({
      template: `
          <help-popover ng-show="ctrl.item" item="ctrl.item" help-controller="ctrl" ng-style="ctrl.popoverController.style()"></help-popover>
          <help-popover-dimensions-calculator ng-show="ctrl.item" item="ctrl.item" help-controller="ctrl"></help-popover-dimensions-calculator>
          <help-backdrop item="ctrl.item" help-controller="ctrl"></help-backdrop>
          <div ng-show="ctrl.item.denyInteraction" class="help-interaction-stopper"></div>
        `,
      controller: InteractiveHelpController,
      controllerAs: 'ctrl',
      resolve: {
        help: () => help,
        stateInitialization: () => stateInitialization
      },
      disableScroll: true
    }).result.then(() => this.interactiveHelpService.close());
  }
}

const focusableSelector = 'a[href], area[href], input:not([disabled]), ' +
                          'button:not([disabled]),select:not([disabled]), textarea:not([disabled]), ' +
                          'iframe, object, embed, *[tabindex], *[contenteditable=true]';


class InteractiveHelpController {

  item?: Story|Notification;
  activeIndex = 0;
  changingLocation = false;

  popoverController: HelpPopoverController;
  popoverDimensionsProvider: PopoverDimensionsProvider;
  backdropController: HelpBackdropController;

  currentScrollTop?: number;
  inTransition = false;

  /* @ngInject */
  constructor(private $scope: IScope,
              private $overlayInstance: OverlayInstance,
              $document: IDocumentService,
              $location: ILocationService,
              private $uibModalStack: IModalStackService,
              confirmationModal: ConfirmationModal,
              private help: InteractiveHelp,
              stateInitialization: () => IPromise<boolean>) {

    let continuing = false;

    stateInitialization().then(willChangeLocation => {
      continuing = willChangeLocation;
      // Reset expectation if navigation event happened before construction
      setTimeout(() => continuing = false, 500);
      this.showItem(0);
    });

    $scope.$on('$locationChangeStart', (event, next) => {
      if (!continuing) {
        event.preventDefault();

        // delay is needed so that click handler has time to modify flag
        setTimeout(() => {
          if (this.changingLocation) {
            continuing = true;
            $scope.$apply(() => {
              $location.url(nextUrl($location, next));
              this.moveToNextItem();
            });
          } else {
            confirmationModal.openCloseHelp().then(() => this.close(true));
          }
        });
      } else {
        continuing = false;
      }
    });

    const debounceUpdatePositions = _.debounce(() => this.updatePositions(), 200);

    $scope.$watch(() => this.item, debounceUpdatePositions);

    const itemPopoverPositioning = () => (this.item && this.item.type === 'story') ? elementPositioning(this.item.popover.element()) : null;
    const itemFocusPositioning = () => this.item && this.item.type === 'story' && this.item.focus ? elementPositioning(this.item.focus.element()) : null;
    const itemScrollPositioning = () => {

      if (!this.item) {
        return null;
      }

      const scroll = InteractiveHelpController.resolveScroll(this.item);

      if (scroll.type !== 'scroll-none') {
        return elementPositioning(scroll.element());
      }

      return null;
    };

    const keyDownHandler = (event: JQueryEventObject) => this.keyDownHandler(event);
    const clickHandler = (event: JQueryEventObject) => this.clickHandler(event);

    // Additional checks for sub-pixel fluctuation are needed for example because of float (fixed style)
    $scope.$watch(itemPopoverPositioning, (newPos, oldPos) => { if (!isPositionInMargin(1, newPos, oldPos)) debounceUpdatePositions(); }, true);
    $scope.$watch(itemFocusPositioning, (newPos, oldPos) => { if (!isPositionInMargin(1, newPos, oldPos)) debounceUpdatePositions(); }, true);
    $scope.$watch(itemScrollPositioning, (newPos, oldPos) => { if (!isPositionInMargin(1, newPos, oldPos)) debounceUpdatePositions(); }, true);

    $scope.$watch(() => this.getPopoverDimensions(), debounceUpdatePositions, true);

    window.addEventListener('resize', debounceUpdatePositions);
    window.addEventListener('scroll', debounceUpdatePositions);
    // Lazy initialization of listeners so that it doesn't intervene with help opening event
    setTimeout(() => {
      $document.on('keydown', keyDownHandler);
      $document.on('click', clickHandler);
    });

    $scope.$on('$destroy', () => {
      window.removeEventListener('resize', debounceUpdatePositions);
      window.removeEventListener('scroll', debounceUpdatePositions);
      $document.off('keydown', keyDownHandler);
      $document.off('click', clickHandler);
    });
  }

  showItem(index: number) {

    const item = this.help.storyLine.items[index];

    if (item.type === 'story' && item.initialize) {
      item.initialize();
    }

    // show full backdrop if item has focus while waiting for debounce
    if (item && (item.type === 'notification' || item.focus)) {
      if (this.backdropController) {
        this.backdropController.setFullBackdrop();
      }
    }

    this.manageActiveElement(item);

    this.inTransition = true;
    this.currentScrollTop = undefined;
    this.item = item;
  }

  private manageActiveElement(item: Story|Notification) {
    // Handle focus off frame since it can cause duplicate digest
    setTimeout(() => {

      // Active element needs to be blurred because it can used for example for multiple interactive help activations
      (document.activeElement as HTMLElement).blur();

      if (item && item.type === 'story' && item.focus && !item.denyInteraction) {

        const focusElement = item.focus.element();

        if (focusElement.length > 0 && isVisible(focusElement[0])) {
          const focusable = focusElement.find(focusableSelector).addBack(focusableSelector).eq(0);
          focusable.focus();
          moveCursorToEnd(focusable);
        } else {
          setTimeout(() => this.manageActiveElement(item), 100);
        }
      }
    });
  }

  private updatePositions(retryCount = 0) {

    if (!this.item) {
      return;
    }

    const positioning = this.popoverController.calculatePositioning(this.item);

    if (positioning) {
      this.scrollTo(this.item, () => {
        this.$scope.$apply(() => {
          this.inTransition = false;
          this.popoverController.setPositioning(positioning);
          this.backdropController.updatePosition();
        });
      });
    } else {
      if (retryCount > 10) {
        throw new Error('Popover element not found');
      } else {
        setTimeout(() => this.updatePositions(retryCount + 1), 100);
      }
    }
  }

  private static resolveScroll(item: Story|Notification) {
    return item.type === 'notification' ? scrollToTop : item.scroll || createScrollWithDefault(item.popover.element, 100);
  }

  scrollTo(item: Story|Notification, cb: () => void) {

    const scroll = InteractiveHelpController.resolveScroll(item);

    if (scroll.type === 'scroll-none') {
      cb();
      return;
    }

    const scrollToElementPositioning = elementPositioning(scroll.element())!;
    const defaultScrollWithElement = angular.element('html, body');

    const calculatePopoverOffsetOnTopOfScrollToElement = (story: Story) => {

      const popoverDimension = this.getPopoverDimensions();

      switch (story.popover.position) {
        case 'left-up':
        case 'right-up':
          return Math.min(0, popoverDimension.height + arrowHeight - scrollToElementPositioning.height);
        case 'top-right':
        case 'top-left':
          return popoverDimension.height + arrowHeight;
        case 'left-down':
        case 'right-down':
        case 'bottom-right':
        case 'bottom-left':
          return 0;
        default:
          return assertNever(story.popover.position, 'Unsupported popover position');
      }
    };

    const resolveScrollWithElement = () => {

      switch (scroll.type) {
        case 'scroll-with-element':
          return scroll.scrollElement();
        case 'scroll-with-default':
          const topModal = this.$uibModalStack.getTop();
          return topModal ? topModal.value.modalDomEl.find('.modal-content') : defaultScrollWithElement;
        default:
          assertNever(scroll, 'Unsupported popover scroll type');
      }
    };

    const scrollWithElement = resolveScrollWithElement();
    const scrollOffsetFromTop = scroll.offsetFromTop || 0;

    let scrollTop = scrollToElementPositioning.top - scrollOffsetFromTop;

    if (scrollWithElement !== defaultScrollWithElement) {

      const scrollWithElementOffsetFromTop = scrollWithElement.offset().top;
      const scrollWithElementScrollingPosition = scrollWithElement.scrollTop();

      scrollTop = scrollTop - scrollWithElementOffsetFromTop + scrollWithElementScrollingPosition;
    }

    if (item.type === 'story') {
      const popoverOffsetFromTop = calculatePopoverOffsetOnTopOfScrollToElement(item);

      if (popoverOffsetFromTop > scrollOffsetFromTop) {
        scrollTop -= popoverOffsetFromTop - scrollOffsetFromTop;
      }
    }

    if (!isNumberInMargin(10, this.currentScrollTop, scrollTop)) {
      const duration = 100;
      scrollWithElement.stop(); // stop previous animation
      scrollWithElement.animate({ scrollTop }, duration, cb);
    } else {
      cb();
    }

    this.currentScrollTop = scrollTop;
  }

  private static loadFocusableElementList(item: Story|Notification): Optional<HTMLElement[]> {

    if (item.type === 'notification' || item.denyInteraction) {
      return [];
    } else if (!item.focus) {
      return null;
    }

    const focusableElements = item.focus.element().find(focusableSelector).addBack(focusableSelector);
    const result: HTMLElement[] = [];

    focusableElements.each((_index: number, element: HTMLElement) => {
      if (isVisible(element) && (!element.tabIndex || element.tabIndex > 0)) {
        result.push(element);
      }
    });

    return result;
  };


  keyDownHandler(event: JQueryEventObject) {

    if (!this.item) {
      stopEvent(event);
    }

    const moveToPreviousIfPossible = () => {
      if (this.canMoveToPrevious()) {
        this.$scope.$apply(() => this.moveToPreviousItem());
      }
    };

    const moveToNextIfPossible = () => {
      if (this.canMoveToNext()) {
        this.$scope.$apply(() => this.tryToMoveToNextItem());
      }
    };

    const manageTabKeyFocus = (item: Story|Notification) => {

      const focusableElements = InteractiveHelpController.loadFocusableElementList(item);

      const activeElementIsFocusable = () => {
        for (const focusableElement of focusableElements || []) {
          if (focusableElement === document.activeElement) {
            return true;
          }
        }
        return false;
      };

      if (focusableElements) {
        if (focusableElements.length > 0) {

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) {
            if (isFocusInElement(event, firstElement)) {
              moveToPreviousIfPossible();
              stopEvent(event);
            }
          } else {
            if (isFocusInElement(event, lastElement)) {
              moveToNextIfPossible();
              stopEvent(event);
            }
          }

          // prevent input focus breaking from item focusable area
          if (!activeElementIsFocusable()) {
            firstElement.focus();
            stopEvent(event);
          }

        } else {
          if (event.shiftKey) {
            moveToPreviousIfPossible();
          } else {
            moveToNextIfPossible();
          }
          stopEvent(event);
        }
      } else {
        // free focus, don't stop event
      }
    };


    switch (event.which) {
      case tab:
        manageTabKeyFocus(this.item!);
        break;
      case enter:
        moveToNextIfPossible();
        stopEvent(event);
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
    setTimeout(() => this.changingLocation = false, 3000);
  }

  clickHandler(event: JQueryEventObject) {
    const item = this.item;

    if (item && item.type === 'story' && isClick(item.nextCondition) && this.isValid()) {
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

  getPopoverDimensions() {
    if (!this.popoverDimensionsProvider) {
      return { width: 0, height: 0 };
    }
    return this.popoverDimensionsProvider.getDimensions();
  }

  registerPopover(popover: HelpPopoverController) {
    this.popoverController = popover;
  }

  registerPopoverDimensionsProvider(provider: PopoverDimensionsProvider) {
    this.popoverDimensionsProvider = provider;
  }

  registerBackdrop(backdrop: HelpBackdropController) {

    this.backdropController = backdrop;

    if (!this.item) {
      this.backdropController.setFullBackdrop();
    }
  }

  canMoveToNext() {
    return !this.inTransition && this.isValid();
  }

  canMoveToPrevious() {

    const previous = this.peekPrevious();

    function isImplicitlyReversible(condition: NextCondition) {
      switch (condition.type) {
        case 'explicit':
          return true;
        case 'click':
        case 'modifying-click':
        case 'navigating-click':
        case 'expected-state':
          return false;
        default:
          return assertNever(condition, 'Unsupported next condition');
      }
    }

    function isReversible(item: Story|Notification) {
      if (item.type === 'notification') {
        return true;
      } else if (item.reversible) {
        return item.reversible;
      } else {
        return isImplicitlyReversible(item.nextCondition);
      }
    }

    return !this.inTransition && !!previous && isReversible(previous);
  }

  get showNext() {
    return !!this.item && !this.isCurrentLastItem() && (this.item.type === 'notification' || !isClick(this.item.nextCondition) || !this.item.nextCondition.ambiguous);
  }

  get showClose() {
    return !!this.item && this.isCurrentLastItem() && (this.item.type === 'notification' || !isClick(this.item.nextCondition) || !this.item.nextCondition.ambiguous);
  }

  get showPrevious() {
    return !this.isCurrentFirstItem();
  }

  peekPrevious(): Optional<Story|Notification> {
    if (this.isCurrentFirstItem()) {
      return null;
    } else {
      return this.help.storyLine.items[this.activeIndex - 1];
    }
  }

  isValid() {

    if (!this.item) {
      return false;
    }

    switch (this.item.type) {
      case 'story':
        switch (this.item.nextCondition.type) {
          case 'explicit':
          case 'click':
          case 'navigating-click':
          case 'modifying-click':
            return true;
          case 'expected-state':
            return this.item.nextCondition.valid();
          default:
            return assertNever(this.item.nextCondition, 'Unknown next condition');
        }
      case 'notification':
        return true;
      default:
        return assertNever(this.item, 'Unknown item type');
    }
  }

  tryToMoveToNextItem() {

    const item = requireDefined(this.item);

    if (item.type === 'notification') {
      this.moveToNextItem();
    } else {

      const nextCondition = item.nextCondition;

      if (isClick(nextCondition)) {
        if (!nextCondition.ambiguous) {
          // off frame so multiple digests are prevented
          setTimeout(() => nextCondition.element().click());
        }
      } else {
        this.moveToNextItem();
      }
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
    return this.activeIndex === this.help.storyLine.items.length - 1;
  }

  close(cancel: boolean) {
    this.$overlayInstance.close();

    if (cancel) {
      if (this.help.onCancel) {
        this.help.onCancel();
      }
    } else {
      if (this.help.onComplete) {
        this.help.onComplete();
      }
    }
  }
}


mod.directive('helpPopoverDimensionsCalculator', () => {
  return {
    restrict: 'E',
    template: `
        <span ng-class="ctrl.arrowClass"></span>
      
        <div class="help-content-wrapper">
          <h3 ng-show="ctrl.item.title">{{ctrl.item.title | translate}}</h3>
          <p ng-show="ctrl.item.content">{{ctrl.item.content | translate}}</p>
          <button ng-show="ctrl.helpController.showPrevious" class="small button help-navigate" translate>previous</button>
          <button ng-show="ctrl.helpController.showNext" class="small button help-navigate" translate>next</button>
          <button ng-show="ctrl.helpController.showClose" class="small button help-next" translate>close</button>
          <a class="help-close">&times;</a>
        </div>
    `,
    bindToController: true,
    scope: {
      item: '<',
      helpController: '<'
    },
    controller: HelpPopoverDimensionsCalculatorController,
    controllerAs: 'ctrl'
  };
});

class HelpPopoverDimensionsCalculatorController implements PopoverDimensionsProvider {

  item: Story|Notification;
  helpController: InteractiveHelpController;
  arrowClass: string[] = [];

  constructor($scope: IScope, private $element: JQuery) {

    this.helpController.registerPopoverDimensionsProvider(this);
    $scope.$watch(() => this.item, item => this.arrowClass = resolveArrowClass(item));
  }

  getDimensions(): { width: number; height: number } {
    return requireDefined(elementPositioning(this.$element));
  }
}

mod.directive('helpPopover', () => {
  return {
    restrict: 'E',
    template: `
        <span ng-class="ctrl.arrowClass"></span>
      
        <div class="help-content-wrapper">
          <h3 ng-show="ctrl.title" ng-bind="ctrl.title | translate"></h3>
          <p ng-show="ctrl.content" ng-bind="ctrl.content | translate"></p>
          <button ng-show="ctrl.showPrevious" ng-disabled="!ctrl.helpController.canMoveToPrevious()" ng-click="ctrl.helpController.moveToPreviousItem()" class="small button help-navigate" translate>previous</button>
          <button ng-show="ctrl.showNext" ng-disabled="!ctrl.helpController.canMoveToNext()" ng-click="ctrl.helpController.tryToMoveToNextItem()" class="small button help-navigate" translate>next</button>
          <button ng-show="ctrl.showClose" ng-disabled="!ctrl.helpController.canMoveToNext()" ng-click="ctrl.helpController.close(false)" class="small button help-next" translate>close</button>
          <a ng-click="ctrl.helpController.close(true)" class="help-close">&times;</a>
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

  item?: Story|Notification;
  arrowClass: string[] = [];

  title: string;
  content?: string;
  showPrevious: boolean;
  showNext: boolean;
  showClose: boolean;

  positioning: Optional<Positioning>;

  constructor(private $scope: IScope, private $document: IDocumentService) {
    this.helpController.registerPopover(this);
    $scope.$watch(() => this.item, item => this.arrowClass = resolveArrowClass(item));
  }

  setPositioning(positioning: Positioning) {

    const item = requireDefined(this.item);

    if (isInWindow(positioning)) {

      this.positioning = positioning;

      // apply positioning before applying content, content is applied in the middle of animation
      setTimeout(() => {
        this.$scope.$apply(() => {
          this.title = item.title;
          this.content = item.content;
          this.showNext = this.helpController.showNext;
          this.showPrevious = this.helpController.showPrevious;
          this.showClose = this.helpController.showClose;
        });
      }, popupAnimationTimeInMs / 2);
    }
  }

  style() {
    return this.positioning;
  }

  calculatePositioning(item: Story|Notification): Optional<Positioning> {

    const popoverDimensions = this.helpController.getPopoverDimensions();
    const documentDimensions = { width: this.$document.width(), height: this.$document.height() };

    switch (item.type) {
      case 'story':
        return HelpPopoverController.calculateStoryPositioning(item, popoverDimensions, documentDimensions);
      case 'notification':
        return HelpPopoverController.calculateNotificationPositioning(popoverDimensions);
      default:
        return assertNever(item, 'Unknown item type');
    }
  }

  private static calculateNotificationPositioning(popoverDimensions: Dimensions): Positioning {
    return HelpPopoverController.calculateCenterPositioning(popoverDimensions);
  }

  private static calculateCenterPositioning(popoverDimensions: Dimensions) {
    return {
      top: window.innerHeight / 2 - popoverDimensions.height / 2,
      left: window.innerWidth / 2 - popoverDimensions.width / 2,
      width: popoverDimensions.width
    };
  }

  private static calculateStoryPositioning(story: Story, popoverDimensions: Dimensions, documentDimensions: Dimensions): Optional<Positioning> {

    const element = story.popover.element();

    if (!element || element.length === 0 || !isVisible(element[0])) {
      return null;
    }

    const popoverWidth = popoverDimensions.width;
    const popoverHeight = popoverDimensions.height;
    const destination = elementPositioning(element)!;
    const documentWidth = documentDimensions.width;
    const documentHeight = documentDimensions.height;

    function calculateUnrestricted() {
      switch (story.popover.position) {
        case 'left-down':
          return { top: destination.top, left: destination.left - popoverWidth - arrowHeight, width: popoverWidth, height: popoverHeight };
        case 'left-up':
          return { top: destination.bottom - popoverHeight, left: destination.left - popoverWidth - arrowHeight, width: popoverWidth, height: popoverHeight };
        case 'right-down':
          return { top: destination.top, left: destination.right + arrowHeight, width: popoverWidth, height: popoverHeight };
        case 'right-up':
          return { top: destination.bottom - popoverHeight, left: destination.right + arrowHeight, width: popoverWidth, height: popoverHeight };
        case 'top-right':
          return { top: destination.top - popoverHeight - arrowHeight, left: destination.left, width: popoverWidth, height: popoverHeight };
        case 'top-left':
          return { top: destination.top - popoverHeight - arrowHeight, left: destination.right - popoverWidth, width: popoverWidth, height: popoverHeight };
        case 'bottom-right':
          return { top: destination.bottom + arrowHeight, left: destination.left, width: popoverWidth, height: popoverHeight };
        case 'bottom-left':
          return { top: destination.bottom + arrowHeight, left: destination.right - popoverWidth, width: popoverWidth, height: popoverHeight };
        default:
          return assertNever(story.popover.position, 'Unsupported popover position');
      }
    }

    function cropToWindow(position: { left: number, top: number, width: number, height: number }) {

      let newLeft = position.left;
      let newTop = position.top;
      let newWidth: number|undefined = position.width;
      let newHeight: number|undefined = position.height;

      if (newLeft < 0) {
        newWidth += newLeft;
        newLeft = 0;
        newHeight = undefined; // allow to expand
      }

      if (newTop < 0) {
        newHeight += newTop;
        newTop = 0;
        newWidth = undefined; // allow to expand
      }

      const right = newLeft + newWidth;

      if (right > documentWidth) {
        newWidth += documentWidth - right;
        newLeft = documentWidth - newWidth;
        newHeight = undefined; // allow to expand
      }

      const bottom = newTop + newHeight;

      if (bottom > documentHeight) {
        newHeight += documentHeight - bottom;
        newTop = documentHeight - newHeight;
        newWidth = undefined; // allow to expand
      }

      return { left: newLeft, top: newTop, width: newWidth, height: newHeight };
    }

    return cropToWindow(calculateUnrestricted());
  }
}

mod.directive('helpBackdrop', () => {
  return {
    restrict: 'E',
    template: `
        <div ng-if="ctrl.regions" class="help-backdrop" ng-style="ctrl.regions.top"></div>
        <div ng-if="ctrl.regions" class="help-backdrop" ng-style="ctrl.regions.right"></div>
        <div ng-if="ctrl.regions" class="help-backdrop" ng-style="ctrl.regions.bottom"></div>
        <div ng-if="ctrl.regions" class="help-backdrop" ng-style="ctrl.regions.left"></div>
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

  item?: Story|Notification;
  regions: Optional<Regions>;

  helpController: InteractiveHelpController;

  constructor(private $document: IDocumentService) {
    this.helpController.registerBackdrop(this);
  }

  setFullBackdrop() {
    this.regions = HelpBackdropController.fullBackdrop;
  }

  updatePosition() {
    if (this.item) {
      this.regions = this.resolveRegions(this.item);
    }
  }

  private static fullBackdrop = {
    top: { left: 0, top: 0, right: 0, bottom: 0 },
    right: { left: 0, top: 0, width: 0, height: 0 },
    bottom: { left: 0, top: 0, width: 0, height: 0 },
    left: { left: 0, top: 0, width: 0, height: 0 },
    focus: { left: 0, top: 0, width: 0, height: 0 }
  };

  private resolveRegions(item: Story|Notification): Optional<Regions> {
    switch (item.type) {
      case 'story':
        return HelpBackdropController.calculateRegions(item, this.$document.width());
      case 'notification':
        return HelpBackdropController.fullBackdrop;
      default:
        return assertNever(item, 'Unknown item type');
    }
  }

  private static calculateRegions(story: Story, documentWidth: number): Optional<Regions> {

    const positioning = HelpBackdropController.calculateFocusPositioning(story);

    if (!positioning) {
      return null;
    }

    return {
      top: {
        left: 0,
        top: 0,
        right: 0,
        height: positioning.top - window.pageYOffset
      },
      right: {
        left: positioning.left + positioning.width,
        top: positioning.top - window.pageYOffset,
        width: documentWidth - positioning.left - positioning.width,
        height: positioning.height
      },
      bottom: {
        left: 0,
        top: positioning.top + positioning.height - window.pageYOffset,
        right: 0,
        bottom: 0
      },
      left: {
        left: 0,
        top: positioning.top - window.pageYOffset,
        width: positioning.left,
        height: positioning.height
      },
      focus: {
        left: positioning.left,
        top: positioning.top - window.pageYOffset,
        width: positioning.width,
        height: positioning.height
      }
    };
  }

  private static calculateFocusPositioning(story: Story) {

    if (!story || !story.focus) {
      return null;
    }

    const focusTo = story.focus;
    const focusToElementPositioning = elementPositioning(story.focus.element())!;

    if (!focusToElementPositioning) {
      return null;
    }

    const marginTop = focusTo.margin && focusTo.margin.top || 0;
    const marginRight = focusTo.margin && focusTo.margin.right || 0;
    const marginBottom = focusTo.margin && focusTo.margin.bottom || 0;
    const marginLeft = focusTo.margin && focusTo.margin.left || 0;

    return {
      width: focusToElementPositioning.width + marginLeft + marginRight,
      height: focusToElementPositioning.height + marginTop + marginBottom,
      left: focusToElementPositioning.left - marginLeft,
      top: focusToElementPositioning.top - marginTop
    };
  }
}

function resolveArrowClass(item: Optional<Story|Notification>) {

  if (!item) {
    return [];
  }

  switch (item.type) {
    case 'story':
      return ['help-arrow', `help-${item.popover.position}`];
    case 'notification':
      return [];
    default:
      return assertNever(item, 'Unknown item type');
  }
}

type Dimensions = { width: number, height: number };

interface PopoverDimensionsProvider {
  getDimensions(): Dimensions;
}

function elementPositioning(element: JQuery) {

  if (!element || element.length === 0) {
    return null;
  }

  const rect = element[0].getBoundingClientRect();

  const left = rect.left + window.pageXOffset;
  const top = rect.top + window.pageYOffset;
  const width = rect.width;
  const height = rect.height;

  return {
    left,
    right: left + width,
    top,
    bottom: top + height,
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

interface Regions {
  top: Positioning;
  right: Positioning;
  bottom: Positioning;
  left: Positioning;
  focus: Positioning;
}

function isNumberInMargin(margin: number, lhs?: number, rhs?: number) {
  return areEqual(lhs, rhs, (l, r) => r >= (l - margin) && r <= (l + margin));
}

function isPositionInMargin(margin: number, lhs: Optional<Positioning>, rhs: Optional<Positioning>) {
  return areEqual(lhs, rhs, (l, r) =>
    isNumberInMargin(margin, l.width, r.width) &&
    isNumberInMargin(margin, l.height, r.height) &&
    isNumberInMargin(margin, l.left, r.left) &&
    isNumberInMargin(margin, l.top, r.top)
  );
}

function isInWindow(positioning: Positioning) {

  const windowTop = window.pageYOffset;
  const windowBottom = windowTop + window.innerHeight;
  const positionTop = positioning.top;
  const positionBottom = positionTop + (positioning.height || 500);

  return positionTop >= windowTop && positionTop <= windowBottom
    || positionBottom >= windowTop && positionBottom <= windowBottom;
}
