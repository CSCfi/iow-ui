import { module as mod } from '../module';
import { OverlayService, OverlayInstance } from '../../components/common/overlay';
import { IScope, IDocumentService, ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import { assertNever, requireDefined, areEqual } from '../../utils/object';
import { tab, esc } from '../../utils/keyCode';
import { isTargetElementInsideElement, nextUrl } from '../../utils/angular';
import { InteractiveHelpService } from '../services/interactiveHelpService';
import {
  NextCondition, Story, Notification, Click, ModifyingClick,
  NavigatingClick, InteractiveHelp, createScrollWithDefault
} from '../contract';
import { contains } from '../../utils/array';
import { ConfirmationModal } from '../../components/common/confirmationModal';

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

    if (this.interactiveHelpService.open) {
      throw new Error('Cannot open help when another help is already open');
    }

    this.interactiveHelpService.open = true;
    const initialization = help.onInit ? help.onInit(this.interactiveHelpService) : this.interactiveHelpService.reset().then(() => false);

    return initialization.then(willChangeLocation => {

      this.interactiveHelpService.open = true;

      return this.overlayService.open({
        template: `
          <help-popover item="ctrl.item" help-controller="ctrl" ng-style="ctrl.popoverController.style()"></help-popover>
          <help-popover-dimensions-calculator item="ctrl.item" help-controller="ctrl"></help-popover-dimensions-calculator>
          <help-backdrop item="ctrl.item" help-controller="ctrl"></help-backdrop>
        `,
        controller: InteractiveHelpController,
        controllerAs: 'ctrl',
        resolve: {
          help: () => help,
          willChangeLocation: () => willChangeLocation
        },
        disableScroll: true
      }).result.then(() => this.interactiveHelpService.open = false);
    });
  }
}

const focusableSelector = 'a[href], area[href], input:not([disabled]), ' +
                          'button:not([disabled]),select:not([disabled]), textarea:not([disabled]), ' +
                          'iframe, object, embed, *[tabindex], *[contenteditable=true]';


class InteractiveHelpController implements DimensionsProvider {

  item: Story|Notification|null = null;
  activeIndex = 0;
  changingLocation = false;

  popoverController: HelpPopoverController;
  dimensionsProvider: DimensionsProvider;
  backdropController: HelpBackdropController;

  /* @ngInject */
  constructor(private $scope: IScope,
              private $overlayInstance: OverlayInstance,
              $document: IDocumentService,
              $location: ILocationService,
              confirmationModal: ConfirmationModal,
              private help: InteractiveHelp,
              willChangeLocation: boolean) {

    const isInitialized = () => !!this.item;
    const initialize = () => this.showItem(0);

    if (!willChangeLocation) {
      initialize();
    }

    const keyDownHandler = this.keyDownHandler.bind(this);
    const clickHandler = this.clickHandler.bind(this);

    $scope.$watch(() => this.item, () => {
      // Active element needs to be blurred because it can used for example for multiple interactive help activations
      // Do off frame since blur causes digest which might be already going
      setTimeout(() => (document.activeElement as HTMLElement).blur());
    });

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

      if (willChangeLocation && !isInitialized()) {
        initialize();
      } else {
        if (!continuing) {
          event.preventDefault();

          // delay is needed so that click handler has time to modify flag
          setTimeout(() => {
            if (this.changingLocation) {
              continuing = true;
              this.moveToNextItem();
              $location.url(nextUrl($location, next));
            } else {
              confirmationModal.openCloseHelp().then(() => this.close(true));
            }
          });
        } else {
          continuing = false;
        }
      }
    });
  }

  loadFocusableElementList(story: Story) {

    if (!story.focus || story.focus.denyInteraction) {
      return [];
    }

    const focusableElements = story.focus.element().find(focusableSelector).addBack(focusableSelector);
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

    if (!item) {
      return stopEvent(event);
    }

    const focusableElements = item.type === 'story' ? this.loadFocusableElementList(item) : [];

    const activeElementIsFocusable = () => {
      for (const focusableElement of focusableElements) {
        if (focusableElement === document.activeElement) {
          return true;
        }
      }
      return false;
    };

    const moveToPreviousIfPossible = () => {
      if (this.canMoveToPrevious()) {
        this.$scope.$apply(() => this.moveToPreviousItem());
      }
    };

    const moveToNextIfPossible = () => {
      if (this.canMoveToNext()) {
        if (item.type === 'notification' || !isClick(item.nextCondition)) {
          this.$scope.$apply(() => this.moveToNextItem());
        } else {
          item.nextCondition.element().click();
        }
      }
    };

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

  getDimensions() {
    return this.dimensionsProvider.getDimensions();
  }

  registerPopover(popover: HelpPopoverController) {
    this.popoverController = popover;
  }

  registerDimensionsProvider(provider: DimensionsProvider) {
    this.dimensionsProvider = provider;
  }

  registerBackdrop(backdrop: HelpBackdropController) {
    this.backdropController = backdrop;
  }

  canMoveToNext() {
    return this.isValid();
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

    return !!previous && isReversible(previous);
  }

  get showNext() {
    return !this.isCurrentLastItem() && (!!this.item && (this.item.type === 'notification' || !isClick(this.item.nextCondition)));
  }

  get showClose() {
    return this.isCurrentLastItem() && (!!this.item && (this.item.type === 'notification' || !isClick(this.item.nextCondition)));
  }

  get showPrevious() {
    return this.canMoveToPrevious();
  }

  peekNext(): Story|Notification|null {
    if (this.isCurrentLastItem()) {
      return null;
    } else {
      return this.help.storyLine.items[this.activeIndex + 1];
    }
  }

  peekPrevious(): Story|Notification|null {
    if (this.isCurrentFirstItem()) {
      return null;
    } else {
      return this.help.storyLine.items[this.activeIndex - 1];
    }
  }

  showItem(index: number) {

    const item = this.help.storyLine.items[index];

    if (item.type === 'story' && item.initialize) {
      item.initialize();
    }

    this.item = item;
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

class HelpPopoverDimensionsCalculatorController implements DimensionsProvider {

  item: Story|Notification;
  helpController: InteractiveHelpController;
  arrowClass: string[] = [];

  constructor($scope: IScope, private $element: JQuery) {

    this.helpController.registerDimensionsProvider(this);
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
          <button ng-show="ctrl.showPrevious" ng-click="ctrl.helpController.moveToPreviousItem()" class="small button help-navigate" translate>previous</button>
          <button ng-show="ctrl.showNext" ng-disabled="!ctrl.helpController.isValid()" ng-click="ctrl.helpController.moveToNextItem()" class="small button help-navigate" translate>next</button>
          <button ng-show="ctrl.showClose" ng-disabled="!ctrl.helpController.isValid()" ng-click="ctrl.helpController.close(false)" class="small button help-next" translate>close</button>
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

  item: Story|Notification;
  arrowClass: string[] = [];

  title: string;
  content?: string;
  showPrevious: boolean;
  showNext: boolean;
  showClose: boolean;

  positioning: Positioning|null = null;

  debounceHandle: any;
  popoverPositionRetryCount = 0;

  constructor(private $scope: IScope, private $document: IDocumentService, private $uibModalStack: IModalStackService) {

    this.helpController.registerPopover(this);

    const setItemStyles = () => {
      this.arrowClass = resolveArrowClass(this.item);

      if (this.item) {
        this.debouncePositionUpdate();
      }
    };

    const storyPopoverPositioning = () => (this.item && this.item.type === 'story') ? elementPositioning(this.item.popover.element()) : null;

    $scope.$watch(() => this.helpController.getDimensions(), setItemStyles, true);
    $scope.$watch(() => this.item, setItemStyles);
    $scope.$watch(storyPopoverPositioning, (newPos, oldPos) => {
      // Additional check for sub-pixel fluctuation caused by float (fixed style)
      if (!isPositionInMargin(1, newPos, oldPos)) {
        setItemStyles();
      }
    }, true);

    window.addEventListener('resize', setItemStyles);
    window.addEventListener('scroll', setItemStyles);

    $scope.$on('$destroy', () => {
      window.removeEventListener('resize', setItemStyles);
      window.removeEventListener('scroll', setItemStyles);
    });
  }

  private debouncePositionUpdate() {

    if (this.debounceHandle) {
      clearTimeout(this.debounceHandle);
    } else {
      this.popoverPositionRetryCount = 0;
    }

    const retry = () => {
      this.popoverPositionRetryCount++;

      if (this.popoverPositionRetryCount > 20) {
        throw new Error('Popover element does not exist');
      } else {
        this.debouncePositionUpdate();
      }
    };

    this.debounceHandle = setTimeout(() => {

      const positioning = this.calculatePositioning();
      const dimension = this.helpController.dimensionsProvider.getDimensions();

      const wouldBeOffScreen = positioning && !fitsToWindow({ top: positioning.top, height: dimension.height });
      const shouldScroll = this.item.type === 'notification' || positioning && !fitsToWindow({ top: positioning.top, height: dimension.height });

      if (shouldScroll) {
        this.scrollTo();
      }

      if (positioning && !wouldBeOffScreen) {
        this.debounceHandle = null;
        this.positioning = positioning;

        // apply positioning before applying content, content is applied in the middle of animation
        setTimeout(() => {
          this.$scope.$apply(() => {
            this.title = this.item.title;
            this.content = this.item.content;
            this.showNext = this.helpController.showNext;
            this.showPrevious = this.helpController.showPrevious;
            this.showClose = this.helpController.showClose;
          });
        }, popupAnimationTimeInMs / 2);
      } else {
        retry();
      }
    }, 100);
  }

  scrollTo() {

    const item = this.item;
    const defaultElement = angular.element('html, body');

    if (item.type === 'notification') {
      defaultElement.animate({ scrollTop: 0 }, 100);
    } else {

      const dimension = this.helpController.getDimensions();
      const popoverScroll = item.popover.scroll || createScrollWithDefault(100);
      const popoverElement = item.popover.element();
      const destinationPositioning = elementPositioning(popoverElement)!;

      const offsetOnTopOfDestination = () => {
        switch (item.popover.position) {
          case 'left-up':
          case 'right-up':
            return Math.min(0, dimension.height + arrowHeight - destinationPositioning.height);
          case 'top-right':
          case 'top-left':
            return dimension.height + arrowHeight;
          case 'left-down':
          case 'right-down':
          case 'bottom-right':
          case 'bottom-left':
            return 0;
          default:
            return assertNever(item.popover.position, 'Unsupported popover position');
        }
      };

      const scrollTop = destinationPositioning.top - offsetOnTopOfDestination();
      const scrollDurationInMs = 100;

      switch (popoverScroll.type) {
        case 'scroll-with-element':
          popoverScroll.element().animate({ scrollTop: scrollTop - popoverScroll.offsetFromTop }, scrollDurationInMs);
          break;
        case 'scroll-with-default':
          const scrollElement = this.$uibModalStack.getTop() ? this.$uibModalStack.getTop().value.modalDomEl.find('.modal-content') : defaultElement;
          scrollElement.animate({ scrollTop: scrollTop - popoverScroll.offsetFromTop }, scrollDurationInMs);
          break;
        case 'scroll-none':
          break;
        default:
          assertNever(popoverScroll, 'Unsupported popover scroll type');
      }
    }
  }

  style() {
    return this.positioning;
  }

  private calculatePositioning(): Positioning|null {

    if (!this.item) {
      throw new Error('Item does not exist');
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

    const dimensions = this.helpController.getDimensions();

    return {
      top: window.innerHeight / 2 - dimensions.height / 2,
      left: window.innerWidth / 2 - dimensions.width / 2,
      width: dimensions.width
    };
  }

  private calculateStoryPositioning(story: Story): Positioning|null {

    const element = story.popover.element();

    if (!element || element.length === 0 || !isVisible(element[0])) {
      return null;
    }

    const dimensions = this.helpController.getDimensions();
    const popoverWidth = dimensions.width;
    const popoverHeight = dimensions.height;
    const destination = elementPositioning(element)!;
    const documentWidth = this.$document.width();
    const documentHeight = this.$document.height();

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
        <div ng-if="ctrl.regions && ctrl.item.focus.denyInteraction" class="help-interaction-stopper" ng-style="ctrl.regions.focus"></div>
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

  debounceHandle: any;

  constructor(private $scope: IScope, private $document: IDocumentService) {

    this.helpController.registerBackdrop(this);

    const storyFocus = () => this.item && this.item.type === 'story' && this.item.focus ? elementPositioning(this.item.focus.element()) : null;
    const debouncePositionUpdateApplyingScope = () => $scope.$apply(() => this.debouncePositionUpdate());

    $scope.$watch(storyFocus, () => this.debouncePositionUpdate(), true);

    window.addEventListener('resize', debouncePositionUpdateApplyingScope);
    window.addEventListener('scroll', debouncePositionUpdateApplyingScope);

    $scope.$on('$destroy', () => {
      window.removeEventListener('resize', debouncePositionUpdateApplyingScope);
      window.removeEventListener('scroll', debouncePositionUpdateApplyingScope);
    });
  }

  private debouncePositionUpdate() {

    if (this.debounceHandle) {
      clearTimeout(this.debounceHandle);
    }

    this.debounceHandle = setTimeout(() => {
      this.focusFirstFocusable();
      // apply focus after animation is almost done
      setTimeout(() => this.$scope.$apply(() => this.regions = this.resolveRegions()), popupAnimationTimeInMs * (4 / 5));
    }, 100);

    // show full backdrop if item has focus while waiting for debounce
    if (this.item && this.item.type === 'story' && this.item.focus) {
      this.regions = HelpBackdropController.fullBackdrop;
    }
  }

  // XXX: does this logic belong to here?
  private focusFirstFocusable() {
    if (this.item && this.item.type === 'story' && this.item.focus && !this.item.focus.denyInteraction) {

      const focusable = this.item.focus.element().find(focusableSelector).addBack(focusableSelector).eq(0);

      focusable.focus();

      if (contains(['INPUT', 'TEXTAREA'], focusable.prop('tagName'))) {
        const valueLength = focusable.val().length;
        // ensures that cursor will be at the end of the input
        if (!contains(['checkbox', 'radio'], focusable.attr('type'))) {
          setTimeout(() => (focusable[0] as HTMLInputElement).setSelectionRange(valueLength, valueLength));
        }
      }
    }
  }

  private static fullBackdrop = {
    top: { left: 0, top: 0, right: 0, bottom: 0 },
    right: { left: 0, top: 0, width: 0, height: 0 },
    bottom: { left: 0, top: 0, width: 0, height: 0 },
    left: { left: 0, top: 0, width: 0, height: 0 },
    focus: { left: 0, top: 0, width: 0, height: 0 }
  };

  private resolveRegions(): Regions|null {

    if (!this.item) {
      return null;
    } else {
      switch (this.item.type) {
        case 'story':
          return this.calculateRegions(this.item);
        case 'notification':
          return HelpBackdropController.fullBackdrop;
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
        height: positioning.top - window.pageYOffset
      },
      right: {
        left: positioning.left + positioning.width,
        top: positioning.top - window.pageYOffset,
        width: this.$document.width() - positioning.left - positioning.width,
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
      width: Math.trunc(focusToElementPositioning.width) + marginLeft + marginRight,
      height: Math.trunc(focusToElementPositioning.height) + marginTop + marginBottom,
      left: Math.trunc(focusToElementPositioning.left) - marginLeft,
      top: Math.trunc(focusToElementPositioning.top) - marginTop
    };
  }
}

function resolveArrowClass(item: Story|Notification|null) {

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

interface DimensionsProvider {
  getDimensions(): { width: number, height: number };
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

function isPositionInMargin(margin: number, lhs: Positioning|null, rhs: Positioning|null) {
  return areEqual(lhs, rhs, (l, r) =>
    isNumberInMargin(margin, l.width, r.width) &&
    isNumberInMargin(margin, l.height, r.height) &&
    isNumberInMargin(margin, l.left, r.left) &&
    isNumberInMargin(margin, l.top, r.top)
  );
}

function fitsToWindow(position: {top: number, height: number}) {

  const windowTop = window.pageYOffset;
  const windowBottom = windowTop + window.innerHeight;
  const positionTop = position.top;
  const positionBottom = positionTop + position.height;

  return positionTop >= windowTop && positionTop <= windowBottom
    && positionBottom >= windowTop && positionBottom <= windowBottom;
}
