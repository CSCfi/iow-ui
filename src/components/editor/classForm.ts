import IAttributes = angular.IAttributes;
import ILocationService = angular.ILocationService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import * as _ from 'lodash';
import { ClassViewController } from './classView';
import { PropertyViewController } from './propertyView';
import { Class, Model, Property } from '../../services/entities';
import { AddPropertiesFromClassModal } from './addPropertiesFromClassModal';
import { normalizeModelType } from '../../services/utils';
import { Uri } from '../../services/uri';

import { module as mod }  from './module';

mod.directive('classForm', () => {
  return {
    scope: {
      class: '=',
      oldClass: '=',
      model: '='
    },
    restrict: 'E',
    template: require('./classForm.html'),
    require: ['classForm', '?^classView'],
    controllerAs: 'ctrl',
    bindToController: true,
    link($scope: IScope, element: JQuery, attributes: IAttributes, [classFormController, classViewController]: [ClassFormController, ClassViewController]) {
      if (classViewController) {
        classViewController.registerForm(classFormController);
        classFormController.isEditing = () => classViewController.isEditing();
      }
    },
    controller: ClassFormController
  };
});

export class ClassFormController {

  class: Class;
  oldClass: Class;
  model: Model;
  isEditing: () => boolean;

  propertyViews: { [key: string]: PropertyViewController } = {};

  /* @ngInject */
  constructor(private $timeout: ITimeoutService, private addPropertiesFromClassModal: AddPropertiesFromClassModal) {
  }

  addPropertiesFromClass(id: Uri, classType: string) {
    const existingPredicates = new Set<string>(_.map(this.class.properties, property => property.predicate.uri));
    const exclude = (property: Property) => existingPredicates.has(property.predicate.uri);
    this.addPropertiesFromClassModal.open(id, classType, exclude)
      .then(properties => _.forEach(properties, (property: Property) => this.class.addProperty(property)));
  }

  get definedByTitle() {
    return normalizeModelType(this.class.definedBy.type);
  }

  linkToSuperclass() {
    return this.model.linkTo('class', this.class.subClassOf);
  }

  linkToScopeclass() {
    return this.model.linkTo('class', this.class.scopeClass);
  }

  get inUnstableState(): boolean {
    return this.class.state === 'Unstable';
  }

  registerPropertyView(propertyId: Uri, view: PropertyViewController) {
    this.propertyViews[propertyId.uri] = view;
  }

  openPropertyAndScrollTo(property: Property) {
    this.$timeout(() => {
      // wait for possible new view to appear
      this.propertyViews[property.id.uri].openAndScrollTo();
    });
  };

  movePropertyUp($event: JQueryEventObject, property: Property) {
    $event.preventDefault();
    $event.stopPropagation();
    const previous = _.find(this.class.properties, p => p.index === property.index - 1);
    property.index--;
    previous.index++;
  }

  movePropertyDown($event: JQueryEventObject, property: Property) {
    $event.preventDefault();
    $event.stopPropagation();
    const next = _.find(this.class.properties, p => p.index === property.index + 1);
    property.index++;
    next.index--;
  }
}
