import Dictionary = _.Dictionary;
import IModalService = angular.ui.bootstrap.IModalService;
import IPromise = angular.IPromise;
import * as _ from 'lodash';
import { Class, Property, Uri } from '../../services/entities';
import { ClassService } from '../../services/classService';
import IModalServiceInstance = angular.ui.bootstrap.IModalServiceInstance;

export class AddPropertiesFromClassModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(classId: Uri, classType: string, excludedPredicates: Set<Uri>): IPromise<Property[]> {
    return this.$uibModal.open({
      template: require('./addPropertiesFromClassModal.html'),
      size: 'adapting',
      controllerAs: 'ctrl',
      controller: AddPropertiesFromSuperClassModalController,
      resolve: {
        classId: () => classId,
        classType: () => classType,
        excludedPredicates: () => excludedPredicates
      }
    }).result;
  }
};

export class AddPropertiesFromSuperClassModalController {

  properties: Property[];
  selectedProperties: Property[];

  /* @ngInject */
  constructor($uibModalInstance: IModalServiceInstance, private classService: ClassService, classId: Uri, public classType: string, excludedPredicates: Set<Uri>) {
    classService.getClass(classId).then(klass => {
      this.properties = _.filter(klass.properties, property => !excludedPredicates.has(property.predicateId));
      this.selectedProperties = _.clone(this.properties);

      if (this.properties.length === 0) {
        $uibModalInstance.close(this.properties);
      }
    });
  }
}
