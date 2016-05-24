import IAttributes = angular.IAttributes;
import ILocationService = angular.ILocationService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import * as _ from 'lodash';
import { ClassViewController } from './classView';
import { Class, Model, Property } from '../../services/entities';
import { AddPropertiesFromClassModal } from './addPropertiesFromClassModal';
import { Uri } from '../../services/uri';
import { ClassService } from '../../services/classService';
import { module as mod }  from './module';

mod.directive('classForm', () => {
  return {
    scope: {
      class: '=',
      oldClass: '=',
      model: '=',
      openPropertyId: '='
    },
    restrict: 'E',
    template: require('./classForm.html'),
    require: ['classForm', '?^classView'],
    controllerAs: 'ctrl',
    bindToController: true,
    link($scope: IScope, element: JQuery, attributes: IAttributes, [classFormController, classViewController]: [ClassFormController, ClassViewController]) {
      classFormController.isEditing = () => classViewController && classViewController.isEditing();
    },
    controller: ClassFormController
  };
});

export class ClassFormController {

  class: Class;
  oldClass: Class;
  model: Model;
  isEditing: () => boolean;
  openPropertyId: string;
  onPropertyReorder = (property: Property, index: number) => property.index = index;

  /* @ngInject */
  constructor(private $scope: IScope,
              private $location: ILocationService,
              private classService: ClassService,
              private addPropertiesFromClassModal: AddPropertiesFromClassModal) {

    this.openPropertyId = $location.search().property;
    $scope.$watch(() => this.openPropertyId, id => $location.search('property', id));
  }

  addPropertiesFromClass(id: Uri, classType: string) {
    this.classService.getInternalOrExternalClass(id, this.model).then(klass => {

      if (klass && klass.properties.length > 0) {

        const existingPredicates = new Set<string>(_.map(this.class.properties, property => property.predicateId.uri));
        const exclude = (property: Property) => existingPredicates.has(property.predicateId.uri);

        this.addPropertiesFromClassModal.open(klass, classType, this.model, exclude)
          .then(properties => _.forEach(properties, (property: Property) => this.class.addProperty(property)));
      }
    });
  }

  linkToSuperclass() {
    return this.model.linkTo({ type: 'class', id: this.class.subClassOf }, true);
  }

  linkToScopeclass() {
    return this.model.linkTo({ type: 'class', id: this.class.scopeClass }, true);
  }

  movePropertyUp($event: JQueryEventObject, property: Property) {
    $event.preventDefault();
    $event.stopPropagation();
    this.class.movePropertyUp(property);
  }

  movePropertyDown($event: JQueryEventObject, property: Property) {
    $event.preventDefault();
    $event.stopPropagation();
    this.class.movePropertyDown(property);
  }
}
