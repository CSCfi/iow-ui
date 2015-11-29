import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import ITimeoutService = angular.ITimeoutService;
import { ClassViewController } from './classView';
import { PropertyViewController } from './propertyView';
import { Class, Model, Property, Uri, states } from '../../services/entities';
import { ModelCache } from '../../services/modelCache';

export const mod = angular.module('iow.components.editor');

mod.directive('classForm', () => {
  'ngInject';
  return {
    scope: {
      class: '=',
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
      }
    },
    controller: ClassFormController
  }
});

export class ClassFormController {

  class: Class;
  model: Model;

  propertyViews: { [key: string]: PropertyViewController } = {};

  /* @ngInject */
  constructor(private $timeout: ITimeoutService, private modelCache: ModelCache) {
  }

  linkToSubclass() {
    return this.model.linkToCurie(this.class.type, this.class.subClassOf, this.modelCache);
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
}
