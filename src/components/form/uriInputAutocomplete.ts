import { IScope, IPromise, IQService } from 'angular';
import * as _ from 'lodash';
import { Model, Type, ClassListItem, PredicateListItem } from '../../services/entities';
import { ClassService } from '../../services/classService';
import { PredicateService } from '../../services/predicateService';
import { module as mod }  from './module';
import { createDefinedByExclusion } from '../../utils/exclusion';
import { cacheNonFilteringDataSource } from './dataSource';

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

type DataType = ClassListItem|PredicateListItem;

export class UriInputAutocompleteController {

  type: Type;
  model: Model;

  constructor(private $scope: IScope, private $q: IQService, private classService: ClassService, private predicateService: PredicateService) {
    $scope.$watchCollection(() => Object.keys(this.model.context), () => {
      this.datasource.invalidateCache(); // invalidate cache
    });
  }

  datasource = cacheNonFilteringDataSource(() => {

    const fetch: () => IPromise<DataType[]> = () => {
      switch (this.type) {
        case 'class':
          return this.$q.all([this.classService.getClassesForModel(this.model), this.classService.getExternalClassesForModel(this.model)])
            .then((lists: ClassListItem[][]) => _.flatten(lists));
        case 'attribute':
        case 'association':
        case 'property':
          return this.$q.all([this.predicateService.getPredicatesForModel(this.model), this.predicateService.getExternalPredicatesForModel(this.model)])
            .then((lists: PredicateListItem[][]) => _.flatten(lists));
        default:
          throw new Error('Unsupported type: ' + this.type);
      }
    };

    const exclusion = createDefinedByExclusion(this.model);
    return fetch().then(data => data.filter(item => !exclusion(item)));
  });

  valueExtractor = (item: DataType) => item.id;
}
