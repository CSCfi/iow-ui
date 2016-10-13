import { module as mod } from './module';
import { OverlayService, OverlayInstance } from './overlay';
import { IScope, ITimeoutService, IDocumentService } from 'angular';
import { assertNever } from '../../utils/object';
import { tab } from '../../utils/keyCode';

export type PopoverPosition = 'top'|'right'|'left'|'bottom';

export interface StoryLine {
  stories: Story[];
}

export interface Story {
  popoverTo: () => JQuery;
  popoverPosition: PopoverPosition;
  focusTo?: () => JQuery;
  title: string;
  content: string;
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
        <help-item class="help-item" help-controller="ctrl" ng-style="ctrl.itemController.itemStyle()"></help-item>
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

  itemController: HelpItemController;
  activeIndex = 0;
  backdrop: { top: Positioning, right: Positioning, bottom: Positioning, left: Positioning } | null;

  /* @ngInject */
  constructor(public $scope: IScope, private $overlayInstance: OverlayInstance, $document: IDocumentService, private storyLine: StoryLine) {

    if (!storyLine || storyLine.stories.length === 0) {
      throw new Error('No stories defined');
    }

    const loadFocusableElementList = () => {

      const isVisible = (element: HTMLElement) => !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
      const story = this.currentStory();

      if (!story.focusTo) {
        return [];
      }

      const focusableElements = story.focusTo().find(focusableSelector);
      const result: HTMLElement[] = [];

      focusableElements.each((_index: number, element: HTMLElement) => {
        if (isVisible(element) && (!element.tabIndex || element.tabIndex > 0)) {
          result.push(element);
        }
      });

      return result;
    };

    const keyDownListener = (event: JQueryEventObject) => {

      const isFocusInElement = (element: HTMLElement) => (event.target || event.srcElement) === element;

      const stopEvent = () => {
        event.preventDefault();
        event.stopPropagation();
      };

      if (!event.isDefaultPrevented()) {
        switch (event.which) {
          case tab: {

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
                  firstElement.focus();
                  stopEvent();
                }
              }
            } else {
              stopEvent();
            }
            break;
          }
        }
      }
    };

    $document.on('keydown', keyDownListener);

    $scope.$on('$destroy', function() {
      $document.off('keydown', keyDownListener);
    });

    const focusPositioning = () => {
      const currentStory = this.currentStory();

      if (!currentStory || !currentStory.focusTo) {
        return null;
      }

      const focusToElement = currentStory.focusTo();

      if (!focusToElement) {
        return null;
      }

      const focusToElementPosition = focusToElement.position();
      const offset = focusToElement.hasClass('row') ? 15 : 0;

      return {
        width: focusToElement.outerWidth(true) + offset * 2,
        height: focusToElement.outerHeight(true),
        left: focusToElementPosition.left - offset,
        top: focusToElementPosition.top
      };
    };

    $scope.$watch(focusPositioning, positioning => {
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
    }, true);
  }

  register(item: HelpItemController) {
    this.itemController = item;
    this.showStory(this.activeIndex);
  }

  nextStory() {
    this.showStory(++this.activeIndex);
  }

  showStory(index: number) {
    const story = this.storyLine.stories[index];
    this.itemController.show(story, index === this.storyLine.stories.length - 1);
  }

  currentStory() {
    return this.storyLine.stories[this.activeIndex];
  }

  close() {
    this.$overlayInstance.close();
  }
}

mod.directive('helpItem', () => {
  return {
    restrict: 'E',
    template: `
        <span ng-class="ctrl.arrowClass"></span>
      
        <div class="help-content-wrapper">
          <h3>{{ctrl.title | translate}}</h3>
          <p>{{ctrl.content | translate}}</p>
          <a ng-if="!ctrl.last" ng-click="ctrl.next()" class="small button help-next-item" translate>next</a>
          <a ng-if="ctrl.last" ng-click="ctrl.close()" class="small button help-next-item" translate>close</a>
          <a ng-click="ctrl.close()" class="help-close-item">&times;</a>
        </div>
      `,
    bindToController: true,
    scope: {
      helpController: '<'
    },
    controller: HelpItemController,
    controllerAs: 'ctrl'
  };
});

class HelpItemController {

  helpController: InteractiveHelpController;

  title: string;
  content: string;
  last: boolean;
  arrowClass: string[] = [];
  offset: { left: number; top: number } | null = null;

  constructor(private $element: JQuery, private $timeout: ITimeoutService) {
    this.helpController.register(this);
  }

  itemStyle() {
    const hideOffset = { left: -1000, top: -1000 };
    return this.offset ? this.offset : hideOffset;
  }

  show(story: Story, last: boolean) {

    const wasHidden = !this.offset;
    this.offset = null;
    this.title = story.title;
    this.content = story.content;
    this.arrowClass = ['help-arrow', `help-${story.popoverPosition}`];
    this.last = last;

    // Off frame so rendering will be done and has correct dimensions
    this.$timeout(() => {

      const popoverToElement = story.popoverTo();
      popoverToElement.find(focusableSelector).focus();

      this.offset = this.calculateOffset(popoverToElement, story.popoverPosition);
      angular.element('html, body').animate( {scrollTop: this.offset!.top - 100 }, 100);
    }, wasHidden ? 0 : 500);
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
    const left = element.position().left;
    const top = element.position().top;
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
        return { top: top + height + arrow, left: left };
      default:
        return assertNever(position);
    }
  }
}