import { IAttributes, IScope } from 'angular';
import { Uri } from '../../services/uri';
import { module as mod }  from './module';
import { PredicateService } from '../../services/predicateService';
import { SearchPredicateModal } from './searchPredicateModal';
import { createDefinedByExclusion } from '../../utils/exclusion';
import { ClassFormController } from './classForm';
import { any } from '../../utils/array';
import { CopyPredicateModal } from './copyPredicateModal';
import { requireDefined } from '../../utils/object';
import { Property } from '../../entities/class';
import { Model } from '../../entities/model';
import { Predicate, Association, Attribute } from '../../entities/predicate';

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
    link(_$scope: IScope, _element: JQuery, _attributes: IAttributes, [thisController, classFormController]: [PropertyPredicateViewController, ClassFormController]) {
      thisController.isEditing = () => classFormController.isEditing();
    }
  };
});


class PropertyPredicateViewController {

  loading: boolean;
  property: Property;
  model: Model;
  predicate: Predicate|null;
  isEditing: () => boolean;
  changeActions: { name: string, apply: () => void }[] = [];
  /* @ngInject */
  constructor($scope: IScope,
              private predicateService: PredicateService,
              private searchPredicateModal: SearchPredicateModal,
              private copyPredicateModal: CopyPredicateModal) {

    const setResult = (p: Predicate|null) => {
        this.predicate = p;
        this.updateChangeActions().then(() => this.loading = false);
    };

    $scope.$watch(() => this.property && this.property.predicate, predicate => {
      this.loading = true;

      if (predicate instanceof Association || predicate instanceof Attribute) {
        setResult(predicate);
      } else if (predicate instanceof Uri) {
        if (this.model.isNamespaceKnownToBeNotModel(predicate.namespace)) {
          predicateService.getExternalPredicate(predicate, this.model).then(setResult, (_err: any) => setResult(null));
        } else {
          predicateService.getPredicate(predicate).then(setResult, (_err: any) => setResult(null));
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

    if (this.property.normalizedPredicateType === 'property') {
      throw new Error('Property must be of known type');
    }

    this.searchPredicateModal.openWithOnlySelection(this.model, requireDefined(this.property.normalizedPredicateType), createDefinedByExclusion(this.model)).then(predicate => {
      this.property.predicate = predicate.id; // Could be full predicate instead of id but this is consistent with api data
    });
  }

  assignReusablePredicateToModel() {
    this.predicateService.assignPredicateToModel(this.property.predicateId, this.model.id)
      .then(() => this.updateChangeActions());
  }

  copyReusablePredicateToModel(predicateToBeCopied: Predicate|Uri, type: 'attribute'|'association') {
    this.copyPredicateModal.open(predicateToBeCopied, type, this.model)
      .then(copied => this.predicateService.createPredicate(copied).then(() => copied))
      .then(predicate => this.property.predicate = predicate.id);
  }
}
