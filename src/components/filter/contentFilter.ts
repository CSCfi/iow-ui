import { module as mod } from './module';
import { SearchController, ContentExtractor, ContentMatcher } from './contract';
import { IScope } from 'angular';
import { ifChanged } from '../../utils/angular';

mod.directive('contentFilter', () => {
  return {
    scope: {
      searchController: '=',
      contentMatchers: '=',
      contentExtractors: '='
    },
    bindToController: true,
    controllerAs: 'ctrl',
    restrict: 'E',
    template: `
        <div class="form-group">
          <label translate>Match to content</label>
        
          <div class="input-group input-group-md">
            <div class="checkbox" ng-repeat="matcher in ctrl.contentMatchers">
              <label><input class="" type="checkbox" checklist-model="ctrl.contentExtractors" checklist-value="matcher.extractor" /> {{matcher.name | translate}}</label>
            </div>
          </div>
        </div>
    `,
    controller: ProfileFilterController
  };
});

class ProfileFilterController<T> {

  searchController: SearchController<T>;
  contentMatchers: ContentMatcher<T>[];
  contentExtractors: ContentExtractor<T>[];

  /* @ngInject */
  constructor($scope: IScope) {
    $scope.$watchCollection(() => this.contentExtractors, ifChanged(() => this.searchController.search()));
  }
}
