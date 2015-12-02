import IAttributes = angular.IAttributes;
import ILogService = angular.ILogService;
import IScope = angular.IScope;
import { PredicateService } from '../../services/predicateService';
import { UserService } from '../../services/userService';
import { EditableEntityController, EditableScope, Rights } from '../form/editableEntityController';
import { Attribute, Association, GroupListItem, Predicate, Model, Uri, states } from '../../services/entities';
import { ConfirmationModal } from '../common/confirmationModal';

export const mod = angular.module('iow.components.editor');

mod.directive('predicateView', () => {
  'ngInject';
  return {
    scope: {
      predicate: '=',
      model: '='
    },
    restrict: 'E',
    template: require('./predicateView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    require: ['predicateView', '^ngController'],
    link($scope: EditableScope, element: JQuery, attributes: IAttributes, controllers: any[]) {
      $scope.modelController = controllers[1];
      $scope.modelController.registerView(controllers[0]);
    },
    controller: PredicateViewController
  };
});

class PredicateViewController extends EditableEntityController<Association|Attribute> {

  predicate: Association|Attribute;
  model: Model;

  /* @ngInject */
  constructor($scope: EditableScope, $log: ILogService, confirmationModal: ConfirmationModal, private predicateService: PredicateService, userService: UserService) {
    super($scope, $log, confirmationModal, userService);
  }

  create(entity: Association|Attribute) {
    return this.predicateService.createPredicate(entity);
  }

  update(entity: Association|Attribute, oldId: Uri) {
    return this.predicateService.updatePredicate(entity, oldId);
  }

  remove(entity: Association|Attribute) {
    return this.predicateService.deletePredicate(entity.id, this.model.id);
  }

  rights(): Rights {
    return {
      edit: () => this.predicate.modelId === this.model.id,
      remove: () => this.predicate.state === states.unstable
    };
  }

  getEditable(): Association|Attribute {
    return this.predicate;
  }

  setEditable(editable: Association|Attribute) {
    this.predicate = editable;
  }

  isDefinedInThisModel(): boolean {
    return this.predicate.modelId === this.model.id;
  }

  getRemoveText(): string {
    if (this.isDefinedInThisModel()) {
      return super.getRemoveText();
    } else {
      return `Delete ${this.predicate.type} from this model`;
    }
  }

  getGroup(): GroupListItem {
    return this.model.group;
  }
}
