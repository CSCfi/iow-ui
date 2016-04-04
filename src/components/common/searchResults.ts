import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import ITranscludeFunction = angular.ITranscludeFunction;
import gettextCatalog = angular.gettext.gettextCatalog;
import * as _ from 'lodash';
import IPromise = angular.IPromise;
import { ConfirmationModal } from './confirmationModal';
import { Uri } from '../../services/uri';
import { module as mod }  from './module';

mod.directive('searchResults', () => {
  return {
    restrict: 'E',
    bindToController: true,
    scope: {
      items: '=',
      exclude: '=',
      onSelect: '&',
      editInProgress: '='
    },
    controllerAs: 'ctrl',
    transclude: true,
    template: require('./searchResults.html'),
    controller: SearchResultsController
  };
});

mod.directive('searchResultTransclude', () => {
  return {
    link($scope: SearchResultScope, element: JQuery, attribute: IAttributes, ctrl: any, transclude: ITranscludeFunction) {
      transclude((clone, transclusionScope) => {
        transclusionScope['searchResult'] = $scope.searchResult.item;
        element.append(clone);
      });
    }
  };
});

interface SearchResultScope extends IScope {
  searchResult: SearchResult<any>;
}

interface WithId {
  id: Uri;
}

export class AddNew {
  constructor(public label: string, public show: () => boolean) {
  }

  unwrap() {
    return this;
  }

  isAddNew() {
    return true;
  }
}

class SearchResult<T extends WithId> {

  disabled: boolean;

  constructor(public item: T, public disabledReason: string) {
    this.disabled = !!disabledReason;
  }

  unwrap() {
    return this.item;
  }

  isAddNew() {
    return false;
  }
}

class SearchResultsController<T extends WithId> {

  items: (T|AddNew)[];
  exclude: (item: T) => string;
  searchResults: (SearchResult<T>|AddNew)[];
  selected: SearchResult<T>|AddNew;
  onSelect: angular.ICompiledExpression;
  editInProgress: () => boolean;

  constructor($scope: IScope, private gettextCatalog: gettextCatalog, private confirmationModal: ConfirmationModal) {
    $scope.$watchCollection(() => this.items, items => {
      this.searchResults = _.map(items, item => {
        if (item instanceof AddNew) {
          return item;
        } else {
          const disabledReason = this.exclude && this.exclude(item);
          return new SearchResult(item, disabledReason);
        }
      });
    });
  }

  isSelected(item: SearchResult<T>|AddNew) {
    return this.selected === item;
  }

  selectItem(item: SearchResult<T>|AddNew) {
    const doSelection = () => {
      this.selected = item;
      this.onSelect({item: item.unwrap()});
    };

    if (this.editInProgress && this.editInProgress()) {
      this.confirmationModal.openEditInProgress().then(doSelection);
    } else {
      doSelection();
    }
  }

  title(item: SearchResult<T>|AddNew) {
    if (item instanceof SearchResult && item.disabled) {
      return this.gettextCatalog.getString(item.disabledReason);
    } else {
      return null;
    }
  }
}
