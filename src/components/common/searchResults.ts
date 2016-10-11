import { IAttributes, IScope, ITranscludeFunction, ICompiledExpression } from 'angular';
import gettextCatalog = angular.gettext.gettextCatalog;
import * as _ from 'lodash';
import { ConfirmationModal } from './confirmationModal';
import { Uri } from '../../entities/uri';
import { module as mod }  from './module';
import { Exclusion } from '../../utils/exclusion';

mod.directive('searchResults', () => {
  return {
    restrict: 'E',
    bindToController: true,
    scope: {
      items: '=',
      selected: '=',
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
    link($scope: SearchResultScope, element: JQuery, _attribute: IAttributes, _ctrl: any, transclude: ITranscludeFunction) {
      transclude((clone, transclusionScope) => {
        transclusionScope!['searchResult'] = $scope.searchResult.item;
        element.append(clone!);
      });
    }
  };
});

interface SearchResultScope extends IScope {
  searchResult: SearchResult<any>;
}

interface WithId {
  id: Uri|string;
}

export abstract class AddNew {
  constructor(public label: string, public show: () => boolean, public glyphiconClass?: (string|{})[]) {
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

  constructor(public item: T, public disabledReason: string|null) {
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
  exclude: Exclusion<T>;
  searchResults: (SearchResult<T>|AddNew)[];
  selected: T|AddNew;
  onSelect: ICompiledExpression;
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

  isVisible(item: SearchResult<T>|AddNew) {
    if (item instanceof AddNew) {
      return item.show();
    } else {
      return true;
    }
  }

  isSelected(item: SearchResult<T>|AddNew) {
    return this.selected === item.unwrap();
  }

  selectItem(item: SearchResult<T>|AddNew) {
    const doSelection = () => {
      this.selected = item.unwrap();
      this.onSelect({item: this.selected});
    };

    if (this.editInProgress && this.editInProgress()) {
      this.confirmationModal.openEditInProgress().then(doSelection);
    } else {
      doSelection();
    }
  }

  title(item: SearchResult<T>|AddNew) {
    if (item instanceof SearchResult && item.disabled) {
      return this.gettextCatalog.getString(item.disabledReason!);
    } else {
      return null;
    }
  }
}
