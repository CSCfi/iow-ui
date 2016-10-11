import { module as mod } from './module';
import * as _ from 'lodash';
import { SearchController } from './contract';
import { IScope } from 'angular';
import { isDefined } from '../../utils/object';
import { ClassService } from '../../services/classService';
import { PredicateService } from '../../services/predicateService';
import { collectIds } from '../../utils/entity';
import { IPromise } from 'angular';
import { comparingLocalizable } from '../../services/comparators';
import { LanguageService } from '../../services/languageService';
import { ifChanged } from '../../utils/angular';
import { ClassListItem } from '../../entities/class';
import { PredicateListItem } from '../../entities/predicate';
import { Model } from '../../entities/model';
import { DefinedBy } from '../../entities/definedBy';

mod.directive('modelFilter', () => {
  return {
    scope: {
      searchController: '=',
      type: '@',
      model: '=',
      defaultShow: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    restrict: 'E',
    template: `
            <div class="form-group">
              <label for="model" translate>Defined by</label>
              <div class="input-group input-group-md">
                <div class="selectContainer">
                  <select id="model" class="form-control" ng-model="ctrl.showModel"
                          ng-options="ctrl.isThisModel(model)
                                    ? ('Assigned to this ' + ctrl.model.normalizedType | translate)
                                    : (model | translateLabel: ctrl.model)
                                    for model in ctrl.models">
                    <option value="" translate>All models</option>
                  </select>
                </div>
              </div>
            </div>
    `,
    controller: ModelFilterController
  };
});

type ItemType = ClassListItem|PredicateListItem;

class ModelFilterController {

  searchController: SearchController<ItemType>;
  type: 'class'|'predicate';
  model: Model;
  defaultShow: Model|DefinedBy;

  showModel: Model|DefinedBy;
  models: (Model|DefinedBy)[] = [];
  private currentModelItemIds: Set<string> = new Set<string>();

  /* @ngInject */
  constructor($scope: IScope, classService: ClassService, predicateService: PredicateService, languageService: LanguageService) {

    const localizer = languageService.createLocalizer(this.model);

    this.showModel = this.defaultShow;

    $scope.$watch(() => this.model, () => {
      const promise: IPromise<(PredicateListItem|ClassListItem)[]> =
        (this.type === 'class' ? classService.getClassesAssignedToModel(this.model)
                               : predicateService.getPredicatesAssignedToModel(this.model));

      promise.then(items => this.currentModelItemIds = collectIds(items))
        .then(() => this.searchController.search());
    });

    $scope.$watch(() => this.searchController.items, items => {
      const definedByFromClasses = _.chain(items)
        .map(item => item.definedBy!)
        .uniqBy(definedBy => definedBy.id.toString())
        .value()
        .sort(comparingLocalizable<DefinedBy>(localizer, definedBy => definedBy.label));

      this.models = [this.model, ...definedByFromClasses];
    });

    this.searchController.addFilter((item: ItemType) => {
        if (!this.showModel) {
          return true;
        } else if (this.showModel === this.model) {
          return this.currentModelItemIds.has(item.id.toString());
        } else {
          return isDefined(item.definedBy) && item.definedBy.id.equals(this.showModel.id);
        }
      }
    );

    $scope.$watch(() => this.showModel, ifChanged(() => this.searchController.search()));
  }

  isThisModel(item: DefinedBy|Model) {
    return this.model === item;
  }
}
