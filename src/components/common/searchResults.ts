import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import ITranscludeFunction = angular.ITranscludeFunction;
import gettextCatalog = angular.gettext.gettextCatalog;
import * as _ from 'lodash';
import { Uri } from '../../services/entities';

export const mod = angular.module('iow.components.common');

mod.directive('searchResults', () => {
  return {
    restrict: 'E',
    bindToController: true,
    scope: {
      items: '=',
      exclude: '=',
      onSelect: '&'
    },
    controllerAs: 'ctrl',
    transclude: true,
    template: require('./searchResults.html'),
    controller: SearchResultsController
  }
});

mod.directive('searchResultTransclude', () => {
  return {
    link($scope: SearchResultScope, element: JQuery, attribute: IAttributes, ctrl: any, transclude: ITranscludeFunction) {
      transclude((clone, transclusionScope) => {
        transclusionScope['searchResult'] = $scope.searchResult.item;
        element.append(clone);
      });
    }
  }
});

interface SearchResultScope extends IScope {
  searchResult: SearchResult<any>;
}

interface WithId {
  id: Uri;
}

class SearchResult<T extends WithId> {

  disabled: boolean;

  constructor(public item: T, public disabledReason: string) {
    this.disabled = !!disabledReason;
  }
}

class SearchResultsController<T extends WithId> {

  items: T[];
  exclude: (item: T) => string;
  searchResults: SearchResult<T>[];
  selected: SearchResult<T>;
  onSelect: angular.ICompiledExpression;

  constructor($scope: IScope, private gettextCatalog: gettextCatalog) {
    $scope.$watchCollection(() => this.items, items => {
      this.searchResults = _.map(items, item => {
        const disabledReason = this.exclude(item);
        return new SearchResult(item, disabledReason);
      });
    });
  }

  isSelected(searchResult: SearchResult<T>) {
    return this.selected === searchResult;
  }

  selectSearchResult(searchResult: SearchResult<T>) {
    if (!searchResult.disabled) {
      this.selected = searchResult;
      this.onSelect({item: searchResult.item});
    }
  }

  searchResultTitle(searchResult: SearchResult<T>) {
    if (searchResult.disabled) {
      return this.gettextCatalog.getString(searchResult.disabledReason);
    }
  }
}
