import { IAttributes, IScope } from 'angular';
import * as _ from 'lodash';
import { ClassViewController } from './classView';
import { Class, Model, Property } from '../../services/entities';
import { AddPropertiesFromClassModal } from './addPropertiesFromClassModal';
import { Uri } from '../../services/uri';
import { ClassService } from '../../services/classService';
import { module as mod }  from './module';
import { isDefined } from '../../utils/object';
import { SearchPredicateModal } from './searchPredicateModal';

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
      classFormController.shouldAutofocus = !isDefined(classViewController);
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
  shouldAutofocus: boolean;

  /* @ngInject */
  constructor(private classService: ClassService,
              private searchPredicateModal: SearchPredicateModal,
              private addPropertiesFromClassModal: AddPropertiesFromClassModal) {
  }

  addProperty() {
    this.searchPredicateModal.openAddProperty(this.model, this.class)
      .then(property => {
        this.class.addProperty(property);
        this.openPropertyId = property.internalId.uuid;
      });
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

  linkToIdClass() {
    return this.model.linkToResource(this.class.id);
  }

  linkToSuperclass() {
    return this.model.linkToResource(this.class.subClassOf);
  }

  linkToScopeclass() {
    return this.model.linkToResource(this.class.scopeClass);
  }
}
