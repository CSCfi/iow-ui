import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import ITranscludeFunction = angular.ITranscludeFunction;
import IParseService = angular.IParseService;
import { module as mod }  from './module';

mod.directive('accordion', () => {
  return {
    scope: {
    },
    controllerAs: 'ctrl',
    controller: AccordionController,
    bindToController: true,
    transclude: true,
    template: `
      <div class="panel-group">
        <ng-transclude></ng-transclude>
      </div>
    `
  };
});


class AccordionController {
  openId: any = null;

  isOpen(id: any) {
    return this.openId === id;
  }

  toggleVisibility(id: any) {
    if (this.isOpen(id)) {
      this.openId = null;
    } else {
      this.openId = id;
    }
  }
}

mod.directive('accordionGroup', () => {
  return {
    scope: {
      identifier: '='
    },
    restrict: 'E',
    transclude: {
      heading: 'accordionHeading',
      body: 'accordionBody'
    },
    template: `
      <div class="panel panel-default">
        <div ng-click="toggleVisibility()">
          <div accordion-transclude="heading" is-open="isOpen"></div>
        </div>
        <div class="panel-collapse collapse" uib-collapse="!isOpen()">
          <div class="panel-body">
            <div accordion-transclude="body" is-open="isOpen"></div>
          </div>
        </div>
      </div>
    `,
    require: '^accordion',
    link: {
      pre($scope: AccordionGroupScope, element: JQuery, attributes: IAttributes, accordionController: AccordionController) {
        $scope.isOpen = () => accordionController.isOpen($scope.identifier);
        $scope.toggleVisibility = () => accordionController.toggleVisibility($scope.identifier);
      }
    }
  };
});

interface AccordionGroupScope extends IScope {
  identifier: any;
  isOpen: () => boolean;
  toggleVisibility: () => void;
}

interface AccordionTranscludeAttributes extends IAttributes {
  accordionTransclude: 'heading' | 'body';
  isOpen: string;
}

interface AccordionTranscludeScope extends IScope {
  isOpen: () => boolean;
}

mod.directive('accordionTransclude', () => {
  return {
    restrict: 'A',
    link($scope: AccordionGroupScope, element: JQuery, attributes: AccordionTranscludeAttributes, controller: any, transclude: ITranscludeFunction) {
      function ngTranscludeCloneAttachFn(clone: JQuery, transcludeScope: AccordionTranscludeScope) {
        element.append(clone);
        transcludeScope.isOpen = $scope.$eval(attributes.isOpen);
      }
      const slotName = attributes.accordionTransclude;
      transclude(ngTranscludeCloneAttachFn, null, slotName);
    }
  };
});
