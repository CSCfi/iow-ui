import { IAttributes, IScope } from 'angular';
import { Class, Property, Predicate, Model, Localizable } from '../../services/entities';
import { ClassFormController } from './classForm';
import { Uri } from '../../services/uri';
import { LanguageService } from '../../services/languageService';
import { any } from '../../utils/array';
import { module as mod }  from './module';
import { hasLocalization } from '../../utils/language';

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
    link($scope: IScope, element: JQuery, _attributes: IAttributes,
         [thisController, classFormController]: [PropertyViewController, ClassFormController]) {

      thisController.isOpen = () => classFormController.openPropertyId === thisController.property.internalId.uuid;
      thisController.isEditing = () => classFormController.isEditing();

      function scrollTo(previousTop?: number) {
        const scrollTop = element.offset().top;

        if (!previousTop || scrollTop !== previousTop) {
          // wait for stabilization
          setTimeout(() => scrollTo(scrollTop), 100);
        } else {
          jQuery('html, body').animate({scrollTop: scrollTop - 105}, 500);
        }
      }

      $scope.$watchCollection(() => thisController.class && thisController.class.properties, () => {
        if (thisController.isOpen()) {
          scrollTo();
        }
      });
    },
    controller: PropertyViewController
  };
});

export class PropertyViewController {

  property: Property;
  class: Class;
  model: Model;
  otherPropertyLabels: Localizable[];
  otherPropertyIdentifiers: string[];
  isEditing: () => boolean;
  isOpen: () => boolean;

  valueClassExclude = (valueClass: Uri) =>
    any(this.class.properties, p => p !== this.property && this.property.predicateId.equals(p.predicateId) && valueClass.equals(p.valueClass))
      ? 'Duplicate association target' : null;

  /* @ngInject */
  constructor($scope: IScope, private languageService: LanguageService) {

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

  stemDatasource(_search: string) {
    return [
      new Uri('http://', {}),
      new Uri('https://', {}),
      new Uri('data:', {}),
      new Uri('mailto:', {}),
      new Uri('tel:', {}),
      new Uri('urn:', {})
    ];
  }

  get showAdditionalInformation() {
    return hasLocalization(this.property.editorialNote);
  }

  removeProperty(property: Property) {
    this.class.removeProperty(property);
  }

  linkToValueClass() {
    return this.model.linkToResource(this.property.valueClass);
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
