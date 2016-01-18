import IAttributes = angular.IAttributes;
import ILocationService = angular.ILocationService;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import * as _ from 'lodash';
import { ClassViewController } from './classView';
import { PropertyViewController } from './propertyView';
import { Class, Model, Property, Uri, states } from '../../services/entities';
import { ModelCache } from '../../services/modelCache';
import { AddPropertiesFromSuperClassModal} from './addPropertiesFromSuperClassModal';

export const mod = angular.module('iow.components.editor');

mod.directive('classForm', () => {
  'ngInject';
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
    link($scope: IScope, element: JQuery, attributes: IAttributes, controllers: any[]) {
      const classFormController: ClassFormController = controllers[0];
      const classViewController: ClassViewController = controllers[1];
      if (classViewController) {
        classViewController.registerForm(classFormController);
        classFormController.isEditing = () => classViewController.isEditing();
      }
    },
    controller: ClassFormController
  }
});

export class ClassFormController {

  class: Class;
  model: Model;
  isEditing: () => boolean;

  propertyViews: { [key: string]: PropertyViewController } = {};

  /* @ngInject */
  constructor($scope: IScope, private $timeout: ITimeoutService, $location: ILocationService, private modelCache: ModelCache, private addPropertiesFromSuperClassModal: AddPropertiesFromSuperClassModal) {
    $scope.$watchCollection(() => this.propertyViews, views => {
      if (!_.any(views, view => view.isOpen)) {
        $location.search('property', null);
      }
    });
  }

  addPropertiesFromSuperClass(id: Uri) {
    let numberOfProperties = this.class.properties.length;
    const existingPredicates = new Set<Uri>(_.map(this.class.properties, property => property.predicateId));
    this.addPropertiesFromSuperClassModal.open(id, existingPredicates)
      .then(properties => _.forEach(properties, (property: Property) => {
        property.index = numberOfProperties++;
        this.class.addProperty(property);
      }));
  }

  linkToSuperclass() {
    return this.model.linkTo(this.class.type, this.class.subClassOf, this.modelCache);
  }

  get inUnstableState(): boolean {
    return this.class.state === states.unstable;
  }

  registerPropertyView(propertyId: Uri, view: PropertyViewController) {
    this.propertyViews[propertyId] = view;
  }

  openPropertyAndScrollTo(property: Property) {
    this.$timeout(() => {
      // wait for possible new view to appear
      this.propertyViews[property.id].openAndScrollTo();
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
