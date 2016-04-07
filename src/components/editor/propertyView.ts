import IAttributes = angular.IAttributes;
import ILocaleService = angular.ILocaleService;
import ILocationService = angular.ILocationService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import * as _ from 'lodash';
import { Class, Property, Predicate, Model, Localizable } from '../../services/entities';
import { ClassFormController } from './classForm';
import { ClassViewController } from './classView';
import { PredicateService } from '../../services/predicateService';
import { normalizeModelType } from '../../services/utils';

import { module as mod }  from './module';

mod.directive('propertyView', /* @ngInject */ ($location: ILocationService, $timeout: ITimeoutService) => {
  return {
    scope: {
      property: '=',
      class: '=',
      model: '='
    },
    restrict: 'E',
    template: require('./propertyView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['propertyView', '^classForm', '?^classView'],
    link($scope: PropertyViewScope, element: JQuery, attributes: IAttributes,
         [thisController, classFormController, classViewController]: [PropertyViewController, ClassFormController, ClassViewController]) {
      $scope.editableController = classViewController;

      thisController.scroll = () => {
        const scrollTop = element.offset().top;
        if (scrollTop === 0) {
          $timeout(thisController.scroll, 100);
        } else {
          jQuery('html, body').animate({scrollTop}, 'slow');
        }
      };

      thisController.anyPropertiesOpen = () => {
        return _.any(classFormController.propertyViews, view => view.isOpen);
      };

      if ($location.search().property === thisController.property.internalId.uri) {
        thisController.openAndScrollTo();
      }

      classFormController.registerPropertyView(thisController.property.internalId, thisController);
    },
    controller: PropertyViewController
  };
});

interface PropertyViewScope extends IScope {
  editableController: ClassViewController;
}

export class PropertyViewController {

  property: Property;
  class: Class;
  model: Model;
  predicate: Predicate;
  isOpen: boolean;
  scroll: () => void;
  otherPropertyLabels: Localizable[];
  otherPropertyIdentifiers: string[];
  anyPropertiesOpen: () => boolean;

  /* @ngInject */
  constructor($scope: IScope, $location: ILocationService, predicateService: PredicateService) {
    $scope.$watch(() => this.isOpen, open => {
      if (open) {
        $location.search('property', this.property.internalId.uri);

        if (!this.predicate) {
          if (this.model.isKnownModelNamespace(this.property.predicate.namespace)) {
            predicateService.getPredicate(this.property.predicate).then(predicate => this.predicate = predicate);
          } else {
            predicateService.getExternalPredicate(this.model, this.property.predicate).then(predicate => this.predicate = predicate);
          }
        }
      } else if (!this.anyPropertiesOpen()) {
        $location.search('property', null);
      }
    });

    $scope.$watchCollection(() => this.class.properties, properties => {
      this.otherPropertyLabels =
        _.chain(properties)
        .filter(property => property !== this.property)
        .map(property => property.label)
        .value();

      this.otherPropertyIdentifiers =
        _.chain(properties)
          .filter(property => property !== this.property)
          .map(property => property.externalId)
          .value();
    });
  }

  get definedByTitle() {
    return this.predicate && normalizeModelType(this.predicate.definedBy.type) || 'Defined by';
  }

  linkToValueClass() {
    return this.model.linkTo({ type: 'class', id: this.property.valueClass });
  }

  openAndScrollTo() {
    this.isOpen = true;
    this.scroll();
  }

  get inUnstableState(): boolean {
    return this.property.state === 'Unstable';
  }
}
