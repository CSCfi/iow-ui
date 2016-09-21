import { IAttributes, IScope, IQService } from 'angular';
import gettextCatalog = angular.gettext.gettextCatalog;
import { Model, Property, Attribute, Association } from '../../services/entities';
import { Uri } from '../../services/uri';
import { module as mod }  from './module';
import { PredicateService } from '../../services/predicateService';
import { SearchPredicateModal } from './searchPredicateModal';
import { createDefinedByExclusion } from '../../utils/exclusion';
import { ClassFormController } from './classForm';
import { any } from '../../utils/array';
import { CopyPredicateModal } from './copyPredicateModal';

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

  loading: boolean;
  property: Property;
  model: Model;
  predicate: Association|Attribute;
  isEditing: () => boolean;
  changeActions: { name: string, apply: () => void }[] = [];
  /* @ngInject */
  constructor($scope: IScope,
              private $q: IQService,
              private predicateService: PredicateService,
              private searchPredicateModal: SearchPredicateModal,
              private copyPredicateModal: CopyPredicateModal) {

    const setResult = (p: Association|Attribute) => {
        this.predicate = p;
        this.updateChangeActions().then(() => this.loading = false);
    };

    $scope.$watch(() => this.property && this.property.predicate, predicate => {
      this.loading = true;

      if (predicate instanceof Association || predicate instanceof Attribute) {
        setResult(predicate);
      } else if (predicate instanceof Uri) {
        if (this.model.isNamespaceKnownToBeNotModel(predicate.namespace)) {
          predicateService.getExternalPredicate(predicate, this.model).then(setResult);
        } else {
          predicateService.getPredicate(predicate).then(setResult);
        }
      } else {
        throw new Error('Unsupported predicate: ' + predicate);
      }
    });
  }

  updateChangeActions() {

    const predicate = this.predicate;

    this.changeActions = [{name: 'Change reusable predicate', apply: () => this.changeReusablePredicate()}];

    if (predicate != null) {

      return this.predicateService.getPredicatesAssignedToModel(this.model).then(predicates => {
        const isAssignedToModel = any(predicates, assignedPredicate => assignedPredicate.id.equals(predicate.id));

        if (!isAssignedToModel) {

          if (!this.model.isNamespaceKnownToBeNotModel(predicate.id.namespace)) {
            this.changeActions.push({
              name: `Assign reusable predicate to ${this.model.normalizedType}`,
              apply: () => this.assignReusablePredicateToModel()
            });
          }

          this.changeActions.push({
            name: `Copy reusable to ${this.model.normalizedType}`,
            apply: () => this.copyReusablePredicateToModel()
          });
        }
      });
    } else {
      return this.$q.when();
    }
  }

  linkToId() {
    return this.predicate && this.model.linkToResource(this.predicate.id);
  }

  changeReusablePredicate() {
    this.searchPredicateModal.openWithOnlySelection(this.model, this.property.normalizedPredicateType, createDefinedByExclusion(this.model)).then(predicate => {
      this.property.predicate = predicate.id; // Could be full predicate instead of id but this is consistent with api data
    });
  }

  assignReusablePredicateToModel() {
    this.predicateService.assignPredicateToModel(this.predicate.id, this.model.id)
      .then(() => this.updateChangeActions());
  }

  copyReusablePredicateToModel() {
    this.copyPredicateModal.open(this.predicate, this. model)
      .then(copied => this.predicateService.createPredicate(copied).then(() => copied))
      .then(predicate => this.property.predicate = predicate.id);
  }
}
