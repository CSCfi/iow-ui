import { IPromise, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import gettextCatalog = angular.gettext.gettextCatalog;
import { LanguageService } from '../../services/languageService';
import { Property, Class } from '../../entities/class';
import { LanguageContext } from '../../entities/contract';
import { flatten, groupBy } from '../../utils/array';
import { stringMapToObject } from '../../utils/object';

const noExclude = (_property: Property) => false;

export class AddPropertiesFromClassModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(klass: Class, classType: string, context: LanguageContext, exclude: (property: Property) => boolean = noExclude): IPromise<Property[]> {
    return this.$uibModal.open({
      template: require('./addPropertiesFromClassModal.html'),
      size: 'adapting',
      controllerAs: 'ctrl',
      controller: AddPropertiesFromClassModalController,
      resolve: {
        klass: () => klass,
        classType: () => classType,
        context: () => context,
        exclude: () => exclude
      }
    }).result;
  }
}

export class AddPropertiesFromClassModalController {

  properties: { [type: string]: Property[] };
  selectedProperties: Property[];

  /* @ngInject */
  constructor(private languageService: LanguageService,
              private gettextCatalog: gettextCatalog,
              klass: Class,
              public classType: string,
              public context: LanguageContext,
              private exclude: (property: Property) => boolean) {

    const copiedPropertiesWithKnownType = klass.properties.filter(p => p.normalizedPredicateType).map(property => property.copy());
    this.properties = stringMapToObject(groupBy(copiedPropertiesWithKnownType, property => property.normalizedPredicateType!));
    this.selectAll();
  }

  isExcluded(property: Property) {
    return this.exclude(property);
  }

  selectAll() {
    this.selectedProperties = flatten(Object.values(this.properties)).filter(property => !this.exclude(property));
  }

  deselectAll() {
    this.selectedProperties = [];
  }

  tooltip(property: Property) {
    if (this.isExcluded(property)) {
      return this.gettextCatalog.getString('Already added');
    } else {
      return this.languageService.translate(property.comment);
    }
  }
}
