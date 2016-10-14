import { module as mod } from './module';
import { OverlayService, OverlayInstance } from './overlay';
import { IScope, IDocumentService, INgModelController, ITimeoutService, IPromise } from 'angular';
import { assertNever } from '../../utils/object';
import { tab, esc } from '../../utils/keyCode';
import { isTargetElementInsideElement } from '../../utils/angular';

export type PopoverPosition = 'top'|'right'|'left'|'bottom';
export type NextCondition = 'explicit'|'click'|'valid-input';

export interface StoryLine {
  stories: Story[];
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
}

interface Positioning {
  width: number;
  height: number;
  left: number;
  top: number;
}

export class InteractiveHelp {

  /* @ngInject */
  constructor(private overlayService: OverlayService) {
  }

  open(storyLine: StoryLine) {
    return this.overlayService.open({
      template: `
        <help-popover class="help-popover" help-controller="ctrl" ng-style="ctrl.popoverController.itemStyle()"></help-popover>
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

class InteractiveHelpController {

  popoverController: HelpPopoverController;
  activeIndex = 0;
  backdrop: { top: Positioning, right: Positioning, bottom: Positioning, left: Positioning } | null;

  /* @ngInject */
  constructor(public $scope: IScope, private $overlayInstance: OverlayInstance, $document: IDocumentService, private storyLine: StoryLine) {

    if (!storyLine || storyLine.stories.length === 0) {
      throw new Error('No stories defined');
    }

    // Active element needs to be blurred because it can used for example for multiple interactive help activations
    angular.element(document.activeElement).blur();

    const keyDownListener = (event: JQueryEventObject) => {

      const stopEvent = () => {
        event.preventDefault();
        event.stopPropagation();
      };

      const isFocusInElement = (element: HTMLElement) => (event.target || event.srcElement) === element;

      const loadFocusableElementList = () => {

        const isVisible = (element: HTMLElement) => !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
        const story = this.currentStory();

        if (!story.focusTo) {
          return [];
        }

        const focusableElements = story.focusTo().element.find(focusableSelector);
        const result: HTMLElement[] = [];

        focusableElements.each((_index: number, element: HTMLElement) => {
          if (isVisible(element) && (!element.tabIndex || element.tabIndex > 0)) {
            result.push(element);
          }
        });

        return result;
      };

      const manageFocus = () => {
        const focusableElements = loadFocusableElementList();

        if (focusableElements.length > 0) {

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) {
            if (isFocusInElement(firstElement)) {
              lastElement.focus();
              stopEvent();
            }
          } else {
            if (isFocusInElement(lastElement)) {
              if (this.popoverController.isValid()) {
                this.nextStory();
              } else {
                firstElement.focus();
              }
              stopEvent();
            }
          }
        } else {
          stopEvent();
        }
      };

      switch (event.which) {
        case tab:
          manageFocus();
          break;
        case esc:
          this.close();
          break;
      }
    };

    const clickListener = (event: JQueryEventObject) => {
      const story = this.currentStory();

      if (story && story.nextCondition === 'click') {
        const popoverElement = story.popoverTo();

        if (!popoverElement || popoverElement.length === 0) {
          throw new Error('Popover element not found');
        }

        if (isTargetElementInsideElement(event, popoverElement[0])) {
          $scope.$apply(() => {
            this.nextStory();
          });
        }
      }
    };

    const focusPositioning = () => {
      const currentStory = this.currentStory();

      if (!currentStory || !currentStory.focusTo) {
        return null;
      }

      const focusTo = currentStory.focusTo();

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
    };

    const setBackdrop = (positioning: Positioning|null) => {
      if (positioning) {
        this.backdrop = {
          top: {
            left: 0,
            top: 0,
            width: $document.width(),
            height: positioning.top
          },
          right: {
            left: positioning.left + positioning.width,
            top: positioning.top,
            width: $document.width() - positioning.left - positioning.width,
            height: positioning.height
          },
          bottom: {
            left: 0,
            top: positioning.top + positioning.height,
            width: $document.width(),
            height: $document.height() - positioning.top - positioning.height
          },
          left: {
            left: 0,
            top: positioning.top,
            width: positioning.left,
            height: positioning.height
          }
        };
      } else {
        this.backdrop = null;
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

    $scope.$watch(focusPositioning, setBackdrop, true);

    const resizeEventHandler = () => $scope.$apply(() => setBackdrop(focusPositioning()));

    window.addEventListener('resize', resizeEventHandler);

    $scope.$on('$destroy', () => {
      window.removeEventListener('resize', resizeEventHandler);
    });
  }

  register(popover: HelpPopoverController) {
    this.popoverController = popover;
    this.showStory(this.activeIndex);
  }

  nextStory() {
    if (this.isCurrentLastStory()) {
      this.close();
    } else {
      this.showStory(++this.activeIndex);
    }
  }

  isLastStory(index: number) {
    return index === this.storyLine.stories.length - 1;
  }

  isCurrentLastStory() {
    return this.isLastStory(this.activeIndex);
  }

  showStory(index: number) {
    const story = this.storyLine.stories[index];
    this.popoverController.show(story, this.isLastStory(index));
  }

  currentStory() {
    return this.storyLine.stories[this.activeIndex];
  }

  close() {
    this.$overlayInstance.close();
  }
}

mod.directive('helpPopover', () => {
  return {
    restrict: 'E',
    template: `
        <span ng-class="ctrl.arrowClass"></span>
      
        <div class="help-content-wrapper">
          <h3>{{ctrl.title | translate}}</h3>
          <p>{{ctrl.content | translate}}</p>
          <button ng-if="!ctrl.last && ctrl.showNext" ng-disabled="!ctrl.isValid()" ng-click="ctrl.next()" class="small button help-next" translate>next</button>
          <button ng-if="ctrl.last && ctrl.showNext" ng-disabled="!ctrl.isValid()" ng-click="ctrl.close()" class="small button help-next" translate>close</button>
          <a ng-click="ctrl.close()" class="help-close">&times;</a>
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

  title: string;
  content: string;
  last: boolean;
  arrowClass: string[] = [];
  showNext: boolean;
  offset: { left: number; top: number } | null = null;
  ngModel: INgModelController|null;

  constructor(private $scope: IScope, private $element: JQuery, public $timeout: ITimeoutService) {
    this.helpController.register(this);
  }

  isValid() {
    return !this.ngModel || this.ngModel.$valid;
  }

  itemStyle() {
    const hideOffset = { left: -1000, top: -1000 };
    return this.offset ? this.offset : hideOffset;
  }

  show(story: Story, last: boolean) {

    const popoverToElement = story.popoverTo();

    this.hide();
    this.title = story.title;
    this.content = story.content;
    this.arrowClass = ['help-arrow', `help-${story.popoverPosition}`];
    this.last = last;
    this.showNext = story.nextCondition !== 'click';

    if (story.nextCondition === 'valid-input') {
      this.ngModel = popoverToElement.find('[ng-model]').addBack('[ng-model]').controller('ngModel');

      if (!this.ngModel) {
        throw new Error('ng-model does not exits for popover element');
      }
    }

    let settingOffset: IPromise<any>;

    this.$scope.$watch(() => this.calculateOffset(popoverToElement, story.popoverPosition), offset => {
      if (settingOffset) {
        this.$timeout.cancel(settingOffset);
      }
      settingOffset = this.$timeout(() => {
        this.offset = offset;
        popoverToElement.find(focusableSelector).addBack(focusableSelector).focus();
        angular.element('html, body').animate({scrollTop: this.offset!.top - 100}, 100);
      }, 500);
    }, true);
  }

  hide() {
    this.offset = null;
  }

  close() {
    this.hide();
    this.helpController.close();
  }

  next() {
    this.helpController.nextStory();
  }

  calculateOffset(element: JQuery, position: PopoverPosition) {

    if (!element || element.length === 0) {
      throw new Error('No element for popover');
    }

    const popoverWidth = this.$element.width();
    const popoverHeight = this.$element.height();
    const left = element.offset().left;
    const top = element.offset().top;
    const width = element.width();
    const height = element.height();
    const arrow = 15;

    switch (position) {
      case 'left':
        return { top: top, left: left - popoverWidth - arrow };
      case 'right':
        return { top: top, left: left + width + arrow * 3};
      case 'top':
        return { top: top - popoverHeight - arrow, left: left };
      case 'bottom':
        return { top: top + height + arrow * 2, left: left };
      default:
        return assertNever(position);
    }
  }
}
