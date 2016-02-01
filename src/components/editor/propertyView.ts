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

export const mod = angular.module('iow.components.editor');

mod.directive('propertyView', ($location: ILocationService, $timeout: ITimeoutService) => {
  'ngInject';
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
    link($scope: PropertyViewScope, element: JQuery, attributes: IAttributes, controllers: [PropertyViewController, ClassFormController, ClassViewController]) {
      $scope.editableController = controllers[2];

      controllers[0].scroll = () => {
        const scrollTop = element.offset().top;
        if (scrollTop === 0) {
          $timeout(controllers[0].scroll, 100);
        } else {
          jQuery('html, body').animate({scrollTop}, 'slow');
        }
      };

      controllers[0].anyPropertiesOpen = () => {
        return _.any(controllers[1].propertyViews, view => view.isOpen);
      };

      if ($location.search().property === controllers[0].property.id) {
        controllers[0].openAndScrollTo();
      }

      controllers[1].registerPropertyView(controllers[0].property.id, controllers[0]);
    },
    controller: PropertyViewController
  }
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
  anyPropertiesOpen: () => boolean;

  /* @ngInject */
  constructor($scope: IScope, $location: ILocationService, predicateService: PredicateService) {
    $scope.$watch(() => this.isOpen, open => {
      if (open) {
        $location.search('property', this.property.id);

        if (!this.predicate) {
          predicateService.getPredicate(this.property.predicateId).then(predicate => {
            this.predicate = predicate;
          });
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
    });
  }

  linkToValueClass() {
    return this.model.linkTo('class', this.property.valueClass, this.model);
  }

  openAndScrollTo() {
    this.isOpen = true;
    this.scroll();
  }

  get inUnstableState(): boolean {
    return this.property.state === 'Unstable';
  }
}
