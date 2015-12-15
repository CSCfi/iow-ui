import Dictionary = _.Dictionary;
import IModalService = angular.ui.bootstrap.IModalService;
import IPromise = angular.IPromise;
import * as _ from 'lodash';
import { Class, Property, Uri } from '../../services/entities';
import { ClassService } from '../../services/classService';

export class AddPropertiesFromSuperClassModal {
  /* @ngInject */
  constructor(private $uibModal: IModalService) {
  }

  open(classId: Uri, excludedPredicates: Set<Uri>): IPromise<Property[]> {
    return this.$uibModal.open({
      template: require('./addPropertiesFromSuperClassModal.html'),
      size: 'adapting',
      controllerAs: 'ctrl',
      controller: AddPropertiesFromSuperClassModalController,
      resolve: {
        classId: () => classId,
        excludedPredicates: () => excludedPredicates
      }
    }).result;
  }
};

export class AddPropertiesFromSuperClassModalController {

  properties: Property[];

  /* @ngInject */
  constructor(private classService: ClassService, classId: Uri, excludedPredicates: Set<Uri>) {
    classService.getClass(classId).then(klass => {
      this.properties = _.filter(klass.properties, property => !excludedPredicates.has(property.predicateId));
    });
  }
}
