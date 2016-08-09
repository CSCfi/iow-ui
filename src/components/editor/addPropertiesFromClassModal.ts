import Dictionary = _.Dictionary;
import IModalService = angular.ui.bootstrap.IModalService;
import IPromise = angular.IPromise;
import * as _ from 'lodash';
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;
import { Class, Property, LanguageContext } from '../../services/entities';
import { ClassService } from '../../services/classService';
import { LanguageService } from '../../services/languageService';
import gettextCatalog = angular.gettext.gettextCatalog;

const noExclude = (property: Property) => false;

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

  properties: Property[];
  selectedProperties: Property[];

  /* @ngInject */
  constructor($uibModalInstance: IModalServiceInstance,
              private classService: ClassService,
              private languageService: LanguageService,
              private gettextCatalog: gettextCatalog,
              klass: Class,
              public classType: string,
              private context: LanguageContext,
              private exclude: (property: Property) => boolean) {

      this.properties = klass.properties;
      this.selectAll();
  }

  isExcluded(property: Property) {
    return this.exclude(property);
  }

  selectAll() {
    this.selectedProperties = _.reject(this.properties, property => this.exclude(property));
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
