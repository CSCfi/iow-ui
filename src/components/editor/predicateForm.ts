import { Association, Model, Attribute, Type } from '../../services/entities';
import { module as mod }  from './module';
import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import { PredicateViewController } from './predicateView';
import { isDefined } from '../../utils/object';
import { UsageService } from '../../services/usageService';
import { ErrorModal } from '../form/errorModal';
import { PredicateService } from '../../services/predicateService';
import { glyphIconClassForType } from '../../utils/entity';

mod.directive('predicateForm', () => {
  return {
    scope: {
      predicate: '=',
      oldPredicate: '=',
      model: '='
    },
    restrict: 'E',
    template: require('./predicateForm.html'),
    bindToController: true,
    controllerAs: 'ctrl',
    require: ['predicateForm', '?^predicateView'],
    link($scope: IScope, element: JQuery, attributes: IAttributes, [predicateFormController, predicateViewController]: [PredicateFormController, PredicateViewController]) {
      predicateFormController.isEditing = () => predicateViewController && predicateViewController.isEditing();
      predicateFormController.shouldAutofocus = !isDefined(predicateViewController);
    },
    controller: PredicateFormController
  };
});

class PredicateFormController {

  model: Model;
  predicate: Attribute|Association;
  oldPredicate: Attribute|Association;
  isEditing: () => boolean;
  shouldAutofocus: boolean;

  /* @ngInject */
  constructor(private predicateService: PredicateService,
              private usageService: UsageService,
              private errorModal: ErrorModal) {
  }

  linkToSuperProperty() {
    return this.model.linkTo({ type: this.predicate.type, id: this.predicate.subPropertyOf }, true);
  }

  linkToValueClass() {
    const predicate = this.predicate;
    if (predicate instanceof Association) {
      return this.model.linkTo({ type: 'class', id: predicate.valueClass }, true);
    } else {
      return '';
    }
  }

  get changedType(): Type {
    return this.predicate instanceof Attribute ? 'association' : 'attribute';
  }

  get changeTypeIconClass() {
    return glyphIconClassForType([this.changedType]);
  }

  changeType() {
    this.usageService.getUsage(this.predicate).then(usage => {
      if (usage.referrers.length > 0) {
        this.errorModal.openUsageError('Predicate in use', 'Predicate type cannot be changed because it is already used by following resources', usage, this.model);
      } else {
        this.predicateService.changePredicateType(this.predicate, this.changedType, this.model)
          .then(changedPredicate => this.predicate = changedPredicate);
      }
    });
  }
}
