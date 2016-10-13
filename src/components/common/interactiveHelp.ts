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

export class InteractiveHelp {

  /* @ngInject */
  constructor(private overlayService: OverlayService) {
  }

  open(storyLine: StoryLine) {
    return this.overlayService.open({
      template: `
        <help-item class="help-item" help-controller="ctrl" ng-style="ctrl.itemController.itemStyle()"></help-item>
        <div class="help-backdrop"></div>
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
    if (story.focusTo) {
      InteractiveHelpController.focusActiveElement(story.focusTo());
    }
    this.itemController.show(story, index === this.storyLine.stories.length - 1);
  }

  currentStory() {
    return this.storyLine.stories[this.activeIndex];
  }

  close() {
    InteractiveHelpController.resetFocus();
    this.$overlayInstance.close();
  }

  static focusActiveElement(element: JQuery) {
    if (!element || element.length === 0) {
      throw new Error('No element for popover');
    }

    InteractiveHelpController.resetFocus();
    element.addClass('help-element-active');
  }

  static resetFocus() {
    angular.element('.help-element-active').removeClass('help-element-active');
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

      this.offset = this.calculateOffset(popoverToElement, story.focusTo && story.focusTo(), story.popoverPosition);
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

  calculateOffset(element: JQuery, focusElement: JQuery|undefined, position: PopoverPosition) {

    if (!element || element.length === 0) {
      throw new Error('No element for popover');
    }

    function isElementInsideFocus() {
      if (!focusElement) {
        return false;
      }

      for (let e = element.parent(); e.length > 0; e = e.parent()) {
        if (e[0] === focusElement[0]) {
          return true;
        }
      }
      return false;
    }

    const elementInsideFocus = isElementInsideFocus();
    const popoverWidth = this.$element.width();
    const popoverHeight = this.$element.height();
    const left = element.position().left + (elementInsideFocus ? focusElement!.position().left : 0);
    const top = element.position().top + (elementInsideFocus ? focusElement!.position().top : 0);
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
