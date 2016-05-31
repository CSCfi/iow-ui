import IAttributes = angular.IAttributes;
import ILocaleService = angular.ILocaleService;
import ILocationService = angular.ILocationService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { Class, Property, Predicate, Model, Localizable } from '../../services/entities';
import { ClassFormController } from './classForm';
import { ClassViewController } from './classView';
import { Uri } from '../../services/uri';
import { LanguageService } from '../../services/languageService';
import { any } from '../../utils/array';
import { module as mod }  from './module';

mod.directive('propertyView', () => {
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
    require: ['propertyView', '^classForm'],
    link($scope: PropertyViewScope, element: JQuery, attributes: IAttributes,
         [thisController, classFormController]: [PropertyViewController, ClassFormController]) {

      thisController.isEditing = () => classFormController.isEditing();

      function scrollTo() {
        const scrollTop = element.offset().top;
        if (scrollTop === 0) {
          setTimeout(scrollTo, 100);
        } else {
          jQuery('html, body').animate({scrollTop}, 'slow');
        }
      }

      $scope.$watch(() => classFormController.openPropertyId, propertyId => {
        if (propertyId === thisController.property.internalId.uri) {
          scrollTo();
        }
      });
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
  otherPropertyLabels: Localizable[];
  otherPropertyIdentifiers: string[];
  isEditing: () => boolean;

  isConflictingValueClass = (valueClass: Uri) =>
    any(this.class.properties, p => p !== this.property && this.property.predicateId.equals(p.predicateId) && valueClass.equals(p.valueClass));

  /* @ngInject */
  constructor($scope: PropertyViewScope, private languageService: LanguageService) {

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

  removeProperty(property: Property) {
    this.class.removeProperty(property);
  }

  linkToValueClass() {
    return this.model.linkTo({ type: 'class', id: this.property.valueClass }, true);
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
