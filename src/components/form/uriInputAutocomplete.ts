import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IPromise = angular.IPromise;
import IRepeatScope = angular.IRepeatScope;
import IModelFormatter = angular.IModelFormatter;
import IQService = angular.IQService;
import { Model, Type, ClassListItem, PredicateListItem } from '../../services/entities';
import { ClassService } from '../../services/classService';
import { PredicateService } from '../../services/predicateService';
import { module as mod }  from './module';
import { createDefinedByExclusion } from '../../utils/exclusion';

mod.directive('uriInputAutocomplete', () => {
  return {
    restrict: 'E',
    scope: {
      type: '@',
      model: '='
    },
    bindToController: true,
    transclude: true,
    template: '<autocomplete fetch-data="ctrl.fetchData" matches="ctrl.matches" property-extractor="ctrl.propertyExtractor"><ng-transclude></ng-transclude></autocomplete>',
    controller: UriInputAutocompleteController,
    controllerAs: 'ctrl'
  };
});

export class UriInputAutocompleteController {

  type: Type;
  model: Model;
  data: IPromise<(ClassListItem|PredicateListItem)[]>;

  constructor(private $q: IQService, private classService: ClassService, private predicateService: PredicateService) {
  }

  fetchData = () => {

    const fetch = () => {
      switch (this.type) {
        case 'class':
          return this.$q.all([this.classService.getClassesForModel(this.model), this.classService.getExternalClassesForModel(this.model)])
            .then((lists: ClassListItem[][]) => _.flatten(lists));
        case 'predicate':
          return this.$q.all([this.predicateService.getPredicatesForModel(this.model), this.predicateService.getExternalPredicatesForModel(this.model)])
            .then((lists: PredicateListItem[][]) => _.flatten(lists));
        default:
          return this.$q.when([]);
      }
    };

    if (!this.data) {
      this.data = fetch();
    }

    return this.data;
  };

  matches = (search: string, item: ClassListItem|PredicateListItem) => {
    const exclusion = createDefinedByExclusion(this.model);
    return !exclusion(item) && _.contains(this.propertyExtractor(item).compact.toLowerCase(), search.toLowerCase());
  };

  propertyExtractor = (item: ClassListItem|PredicateListItem) => {
    return item.id;
  };
}
