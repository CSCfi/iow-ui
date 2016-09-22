import { IAttributes, IScope, IQService } from 'angular';
import gettextCatalog = angular.gettext.gettextCatalog;
import { Model, Property, Attribute, Association, Predicate } from '../../services/entities';
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
  predicate: Predicate;
  isEditing: () => boolean;
  changeActions: { name: string, apply: () => void }[] = [];
  /* @ngInject */
  constructor($scope: IScope,
              private $q: IQService,
              private predicateService: PredicateService,
              private searchPredicateModal: SearchPredicateModal,
              private copyPredicateModal: CopyPredicateModal) {

    const setResult = (p: Predicate) => {
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
    const predicateId = this.property.predicateId;

    this.changeActions = [{name: 'Change reusable predicate', apply: () => this.changeReusablePredicate()}];

    const assignAction = () => {
      return {
        name: `Assign reusable predicate to ${this.model.normalizedType}`,
        apply: () => this.assignReusablePredicateToModel()
      };
    };

    const copyAction = (type: 'attribute'|'association') => {
      return {
        name: `Copy reusable ${type} to ${this.model.normalizedType}`,
        apply: () => this.copyReusablePredicateToModel(predicate || predicateId, type)
      };
    };

    return this.predicateService.getPredicatesAssignedToModel(this.model).then(predicates => {

      const isAssignedToModel = any(predicates, assignedPredicate => assignedPredicate.id.equals(predicateId));

      if (!isAssignedToModel) {
        if (predicate && (this.model.isOfType('profile') || predicate.definedBy.isOfType('library')) && this.model.isNamespaceKnownToBeModel(predicate.id.namespace)) {
          this.changeActions.push(assignAction());
        }

        if (predicate && (predicate.isAssociation() || predicate.isAttribute())) {
          this.changeActions.push(copyAction(predicate.normalizedType as 'attribute' | 'association'));
        } else {
          this.changeActions.push(copyAction('attribute'));
          this.changeActions.push(copyAction('association'));
        }
      }
    });
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

  copyReusablePredicateToModel(predicateToBeCopied: Predicate|Uri, type: 'attribute'|'association') {
    this.copyPredicateModal.open(predicateToBeCopied, type, this.model)
      .then(copied => this.predicateService.createPredicate(copied).then(() => copied))
      .then(predicate => this.property.predicate = predicate.id);
  }
}
