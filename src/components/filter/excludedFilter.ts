import { module as mod } from './module';
import { SearchController } from './contract';
import { IScope } from 'angular';
import { Exclusion } from '../../utils/exclusion';
import { ifChanged } from '../../utils/angular';

mod.directive('excludedFilter', () => {
  return {
    scope: {
      searchController: '=',
      exclude: '=',
      searchText: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    restrict: 'E',
    controller: ProfileFilterController
  };
});

class ProfileFilterController<T> {

  searchController: SearchController<T>;
  searchText: string;
  exclude: Exclusion<T>;

  /* @ngInject */
  constructor($scope: IScope) {
    this.searchController.addFilter((item: T) =>
      this.showExcluded || !this.exclude(item)
    );

    $scope.$watch(() => this.exclude, ifChanged(() => this.searchController.search()));
  }

  get showExcluded() {
    return !!this.searchText;
  }
}
