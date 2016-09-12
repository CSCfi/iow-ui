import { IAttributes, IScope } from 'angular';
import gettextCatalog = angular.gettext.gettextCatalog;
import { Predicate, Model, Property } from '../../services/entities';
import { Uri } from '../../services/uri';
import { module as mod }  from './module';
import { PredicateService } from '../../services/predicateService';
import { SearchPredicateModal } from './searchPredicateModal';
import { createDefinedByExclusion } from '../../utils/exclusion';
import { ClassFormController } from './classForm';

mod.directive('propertyPredicateView', () => {
  return {
    scope: {
      property: '=',
      model: '='
    },
    restrict: 'E',
    template: require('./propertyPredicateView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: PropertyPredicateViewController,
    require: ['propertyPredicateView', '^classForm'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [thisController, classFormController]: [PropertyPredicateViewController, ClassFormController]) {
      thisController.isEditing = () => classFormController.isEditing();
    }
  };
});


class PropertyPredicateViewController {

  property: Property;
  model: Model;
  predicate: Predicate;
  isEditing: () => boolean;

  /* @ngInject */
  constructor($scope: IScope, predicateService: PredicateService, private searchPredicateModal: SearchPredicateModal) {

    $scope.$watch(() => this.property && this.property.predicate, predicate => {
      if (predicate instanceof Predicate) {
        this.predicate = predicate;
      } else if (predicate instanceof Uri) {
        if (this.model.isNamespaceKnownToBeNotModel(predicate.namespace)) {
          predicateService.getExternalPredicate(predicate, this.model).then(p => this.predicate = p);
        } else {
          predicateService.getPredicate(predicate).then(p => this.predicate = p);
        }
      } else {
        throw new Error('Unsupported predicate: ' + predicate);
      }
    });
  }

  linkToId() {
    return this.model.linkToResource(this.predicate.id);
  }

  changeReusablePredicate() {
    this.searchPredicateModal.openWithOnlySelection(this.model, this.predicate.normalizedType, createDefinedByExclusion(this.model)).then(predicate => {
      this.property.predicate = predicate.id; // Could be full predicate instead of id but this is consistent with api data
    });
  }
}
