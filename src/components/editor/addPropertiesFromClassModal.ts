import { IPromise, ui } from 'angular';
import IModalService = ui.bootstrap.IModalService;
import gettextCatalog = angular.gettext.gettextCatalog;
import * as _ from 'lodash';
import Dictionary = _.Dictionary;
import { Class, Property, LanguageContext } from '../../services/entities';
import { LanguageService } from '../../services/languageService';

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
};

export class AddPropertiesFromClassModalController {

  properties: Dictionary<Property[]>;
  selectedProperties: Property[];

  /* @ngInject */
  constructor(private languageService: LanguageService,
              private gettextCatalog: gettextCatalog,
              klass: Class,
              public classType: string,
              public context: LanguageContext,
              private exclude: (property: Property) => boolean) {

      this.properties = _.groupBy<Property>(klass.properties.map(property => property.copy()), 'normalizedPredicateType');
      this.selectAll();
  }

  isExcluded(property: Property) {
    return this.exclude(property);
  }

  selectAll() {
    this.selectedProperties = _.reject(_.flatten(Object.values(this.properties)), property => this.exclude(property));
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
