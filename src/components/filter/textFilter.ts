import { module as mod } from './module';
import { SearchController, TextAnalysis } from './contract';
import { IScope } from 'angular';
import { ifChanged } from '../../utils/angular';
import { isDefined } from '../../utils/object';

mod.directive('textFilter', () => {
  return {
    scope: {
      searchText: '=',
      contentExtractors: '=',
      placeholder: '=',
      searchController: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    restrict: 'E',
    template: `
          <div class="input-group input-group-lg">
            <input autofocus type="text" class="form-control" placeholder="{{ctrl.placeholder | translate}}"
                   ng-model="ctrl.searchText"
                   ignore-dirty
                   ng-model-options="{ debounce: { 'default': 500, 'blur': 0 } }"
                   key-control="ctrl.searchController.searchResults" />
            <i class="glyphicon glyphicon-search form-control-feedback"></i>
          </div>
    `,
    controller: TextSearchController
  };
});

class TextSearchController<T> {

  placeholder: string;
  searchController: SearchController<T>;
  searchText: string;

  constructor($scope: IScope) {

    this.searchController.addFilter((item: TextAnalysis<T>) => !this.searchText || isDefined(item.matchScore) || item.score < 2);

    $scope.$watch(() => this.searchText, ifChanged(() => this.searchController.search()));
  }
}
