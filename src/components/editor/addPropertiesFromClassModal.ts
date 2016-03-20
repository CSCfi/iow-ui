import Dictionary = _.Dictionary;
import IModalService = angular.ui.bootstrap.IModalService;
import IPromise = angular.IPromise;
import * as _ from 'lodash';
import { Class, Property, Uri } from '../../services/entities';
import { ClassService } from '../../services/classService';
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;

const noExclude = (property: Property) => false;

export class AddPropertiesFromClassModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(klass: Uri|Class, classType: string, exclude: (property: Property) => boolean = noExclude): IPromise<Property[]> {
    return this.$uibModal.open({
      template: require('./addPropertiesFromClassModal.html'),
      size: 'adapting',
      controllerAs: 'ctrl',
      controller: AddPropertiesFromClassModalController,
      resolve: {
        klass: () => klass,
        classType: () => classType,
        exclude: () => exclude
      }
    }).result;
  }
};

export class AddPropertiesFromClassModalController {

  properties: Property[];
  selectedProperties: Property[];

  /* @ngInject */
  constructor($uibModalInstance: IModalServiceInstance, private classService: ClassService, klass: Uri|Class, public classType: string, private exclude: (property: Property) => boolean) {

    const init = (fetchedClass: Class) => {
      this.properties = fetchedClass.properties;
      this.selectedProperties = _.reject(this.properties, property => exclude(property));

      if (this.selectedProperties.length === 0) {
        $uibModalInstance.close(this.selectedProperties);
      }
    };

    if (klass instanceof Class) {
      init(klass);
    } else {
      const classId: Uri = <Uri> klass;
      classService.getClass(classId).then(fetchedClass => init(fetchedClass));
    }
  }

  isExcluded(property: Property) {
    return this.exclude(property);
  }
}
