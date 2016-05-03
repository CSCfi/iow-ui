import IAttributes = angular.IAttributes;
import ILocaleService = angular.ILocaleService;
import ILocationService = angular.ILocationService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import gettextCatalog = angular.gettext.gettextCatalog;
import * as _ from 'lodash';
import { Class, Property, Predicate, Model, Localizable, NamespaceType } from '../../services/entities';
import { ClassFormController } from './classForm';
import { ClassViewController } from './classView';
import { PredicateService } from '../../services/predicateService';
import { module as mod }  from './module';
import { Uri } from '../../services/uri';
import { LanguageService } from '../../services/languageService';

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
      thisController.isEditing = () => classViewController && classViewController.isEditing();

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
  isEditing: () => boolean;

  /* @ngInject */
  constructor($scope: PropertyViewScope, $location: ILocationService, predicateService: PredicateService, private languageService: LanguageService) {
    $scope.$watch(() => this.isOpen, open => {
      if (open) {
        if ($scope.editableController) {
          $location.search('property', this.property.internalId.uri);
        }

        if (this.predicate === undefined) {

          const predicate = this.property.predicate;

          if (predicate instanceof Predicate) {
            this.predicate = predicate;
          } else if (predicate instanceof Uri) {
            if (this.model.isNamespaceKnownAndOfType(predicate.namespace, [NamespaceType.EXTERNAL, NamespaceType.TECHNICAL])) {
              predicateService.getExternalPredicate(predicate, this.model).then(p => this.predicate = p);
            } else {
              predicateService.getPredicate(predicate).then(p => this.predicate = p);
            }
          } else {
            throw new Error('Unsupported predicate: ' + predicate);
          }
        }
      } else if (!this.anyPropertiesOpen()) {
        if ($scope.editableController) {
          $location.search('property', null);
        }
      }
    });

    $scope.$watchCollection(() => this.class.properties, properties => {
      this.otherPropertyLabels = [];
      this.otherPropertyIdentifiers = [];

      for (const property of properties) {
        if (property !== this.property) {
          this.otherPropertyLabels.push(property.label);
          this.otherPropertyIdentifiers.push(property.externalId);
        }
      }
    });
  }

  linkToValueClass() {
    return this.model.linkTo({ type: 'class', id: this.property.valueClass }, true);
  }

  openAndScrollTo() {
    this.isOpen = true;
    this.scroll();
  }

  isAssociation() {
    return this.property.isAssociation() || (this.predicate && this.predicate.isAssociation());
  }

  isAttribute() {
    return this.property.isAttribute() || (this.predicate && this.predicate.isAttribute());
  }

  get inUnstableState(): boolean {
    return this.property.state === 'Unstable';
  }

  get predicateName() {
    const predicate = this.property.predicate;
    if (predicate instanceof Predicate) {
      return this.languageService.translate(predicate.label, this.model);
    } else if (predicate instanceof Uri) {
      return predicate.compact;
    } else {
      throw new Error('Unsupported predicate: ' + predicate);
    }
  }
}
