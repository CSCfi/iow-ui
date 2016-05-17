import IScope = angular.IScope;
import IAttributes = angular.IAttributes;
import INgModelController = angular.INgModelController;
import IPromise = angular.IPromise;
import IRepeatScope = angular.IRepeatScope;
import IModelFormatter = angular.IModelFormatter;
import IQService = angular.IQService;
import * as _ from 'lodash';
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
    template: '<autocomplete datasource="ctrl.datasource" value-extractor="ctrl.valueExtractor"><ng-transclude></ng-transclude></autocomplete>',
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

  datasource = () => {

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
      const exclusion = createDefinedByExclusion(this.model);
      this.data = fetch().then(data => _.filter(data, item => !exclusion(item)));
    }

    return this.data;
  };

  valueExtractor = (item: ClassListItem|PredicateListItem) => item.id;
}
