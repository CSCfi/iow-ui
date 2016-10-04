import { module as mod } from './module';
import { SearchController, ContentExtractor } from './contract';
import { valueContains } from '../../utils/searchFilter';
import { any } from '../../utils/array';
import { IScope } from 'angular';
import { ifChanged } from '../../utils/angular';

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

  contentExtractors: ContentExtractor<T>[];
  placeholder: string;
  searchController: SearchController<T>;
  searchText: string;

  constructor($scope: IScope) {

    this.searchController.addFilter((item: T) =>
        !this.searchText || any(this.contentExtractors, extractor => valueContains(extractor(item), this.searchText))
    );

    $scope.$watch(() => this.searchText, ifChanged(() => this.searchController.search()));
  }
}
