import { module as mod } from './module';
import { OverlayService, OverlayInstance } from './overlay';
import { IScope, IDocumentService, ILocationService, ui } from 'angular';
import IModalStackService = ui.bootstrap.IModalStackService;
import { assertNever, requireDefined, areEqual } from '../../utils/object';
import { tab, esc } from '../../utils/keyCode';
import { isTargetElementInsideElement, nextUrl } from '../../utils/angular';
import { InteractiveHelpService } from '../../help/services/interactiveHelpService';
import {
  NextCondition, Story, Notification, Click, ModifyingClick,
  NavigatingClick, InteractiveHelp
} from '../../help/contract';
import { contains } from '../../utils/array';
import { ConfirmationModal } from './confirmationModal';

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

    const initialization = help.onInit ? help.onInit(this.interactiveHelpService) : this.interactiveHelpService.reset();

    return initialization.then(() => {

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
          help: () => help
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

  item: Story|Notification;
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
              private help: InteractiveHelp) {

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
            this.moveToNextItem();
            $location.url(nextUrl($location, next));
          } else {
            confirmationModal.openCloseHelp().then(() => this.close(true));
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
    return true;
  }

  canMoveToPrevious() {
    return !this.isCurrentFirstItem() && !this.item.cannotMoveBack;
  }

  get showNext() {
    return this.canMoveToNext()
      && !this.isCurrentLastItem()
      && (this.item.type === 'notification' || !isClick(this.item.nextCondition));
  }

  get showClose() {
    return this.canMoveToNext()
      && this.isCurrentLastItem()
      && (this.item.type === 'notification' || !isClick(this.item.nextCondition));
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

  showItem(index: number) {

    this.item = this.help.storyLine.items[index];
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
          <h3>{{ctrl.item.title | translate}}</h3>
          <p>{{ctrl.item.content | translate}}</p>
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
  content: string;
  showPrevious: boolean;
  showNext: boolean;
  showClose: boolean;

  positioning: Positioning|null = null;

  debounceHandle: any;

  constructor(private $scope: IScope, private $document: IDocumentService, private $uibModalStack: IModalStackService) {

    this.helpController.registerPopover(this);

    const setItemStyles = () => {
      this.arrowClass = resolveArrowClass(this.item);

      if (this.item) {
        this.debouncePositionUpdate();
      }
    };

    const storyPopoverPositioning = () => this.item && this.item.type === 'story' && elementPositioning(this.item.popoverTo());

    $scope.$watch(() => this.helpController.getDimensions(), setItemStyles, true);
    $scope.$watch(() => this.item, setItemStyles);
    $scope.$watch(storyPopoverPositioning, setItemStyles, true);

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
    }

    this.debounceHandle = setTimeout(() => {
      this.debounceHandle = null;
      this.$scope.$apply(() => {
        const positioning = this.calculatePositioning();

        if (positioning && positioning.width > 0) {
          this.positioning = positioning;

          // apply positioning before applying content
          setTimeout(() => {
            this.scrollTo();
            this.$scope.$apply(() => {
              this.title = this.item.title;
              this.content = this.item.content;
              this.showNext = this.helpController.showNext;
              this.showPrevious = this.helpController.showPrevious;
              this.showClose = this.helpController.showClose;
            });
          }, 150);
        }
      });
    }, 100);
  }

  scrollTo() {
    const scrollElement = this.$uibModalStack.getTop() ? this.$uibModalStack.getTop().value.modalDomEl.find('.modal-content') : 'html, body';
    const scrollTo = requireDefined(this.item).type === 'story' && this.positioning ? this.positioning.top - 100 : 0;
    angular.element(scrollElement).animate({ scrollTop: scrollTo }, 100);
  }

  style() {
    return this.positioning;
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

    const dimensions = this.helpController.getDimensions();

    return {
      top: window.innerHeight / 2 - dimensions.height / 2,
      left: window.innerWidth / 2 - dimensions.width / 2,
      width: dimensions.width
    };
  }

  private calculateStoryPositioning(story: Story): Positioning|null {

    const element = story.popoverTo();

    if (!element || element.length === 0) {
      return null;
    }

    const dimensions = this.helpController.getDimensions();
    const popoverWidth = dimensions.width;
    const popoverHeight = dimensions.height;
    const { left, top, width, height } = elementPositioning(element)!;

    const arrow = 13;
    const documentWidth = angular.element(this.$document).width();

    // TODO more generic cropping to viewport
    switch (story.popoverPosition) {
      case 'left':
        const leftPopoverLeft = left - popoverWidth - arrow;
        const leftWidthOffScreen = leftPopoverLeft < 0 ? -leftPopoverLeft : 0;
        return { top: top, left: leftPopoverLeft + leftWidthOffScreen, width: popoverWidth - leftWidthOffScreen, height: leftWidthOffScreen ? undefined : popoverHeight };
      case 'right':
        const rightPopoverLeft = left + width + arrow;
        const rightPopoverRight = documentWidth - (rightPopoverLeft + popoverWidth);
        const rightWidthOffScreen = rightPopoverRight < 0 ? -rightPopoverRight : 0;
        return { top: top, left: rightPopoverLeft, width: popoverWidth - rightWidthOffScreen, height: rightWidthOffScreen ? undefined : popoverHeight };
      case 'top':
        const topPopoverRight = documentWidth - (left + popoverWidth);
        const topWidthOffScreen = topPopoverRight < 0 ? -topPopoverRight : 0;
        return { top: top - popoverHeight - arrow, left: left, width: popoverWidth - topWidthOffScreen, height: topWidthOffScreen ? undefined : popoverHeight };
      case 'bottom':
        const bottomPopoverRight = documentWidth - (left + popoverWidth);
        const bottomWidthOffScreen = bottomPopoverRight < 0 ? -bottomPopoverRight : 0;
        return { top: top + height + arrow, left: left, width: popoverWidth - bottomWidthOffScreen, height: bottomWidthOffScreen ? undefined : popoverHeight };
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

function resolveArrowClass(item: Story|Notification|null) {

  if (!item) {
    return [];
  }

  switch (item.type) {
    case 'story':
      return ['help-arrow', `help-${item.popoverPosition}`];
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

  return {
    left: rect.left + window.pageXOffset,
    top: rect.top + window.pageYOffset,
    width: rect.width,
    height: rect.height
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
