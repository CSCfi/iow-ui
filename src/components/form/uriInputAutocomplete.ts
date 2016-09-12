import { IPromise, IQService } from 'angular';
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

type DataType = ClassListItem|PredicateListItem;

export class UriInputAutocompleteController {

  type: Type;
  model: Model;
  data: IPromise<DataType[]>;

  constructor(private $q: IQService, private classService: ClassService, private predicateService: PredicateService) {
  }

  datasource = (search: string) => {

    const that = this;

    function fetch(): IPromise<DataType[]> {
      switch (that.type) {
        case 'class':
          return that.$q.all([that.classService.getClassesForModel(that.model), that.classService.getExternalClassesForModel(that.model)])
            .then((lists: ClassListItem[][]) => _.flatten(lists));
        case 'attribute':
        case 'association':
        case 'property':
          return that.$q.all([that.predicateService.getPredicatesForModel(that.model), that.predicateService.getExternalPredicatesForModel(that.model)])
            .then((lists: PredicateListItem[][]) => _.flatten(lists));
        default:
          throw new Error('Unsupported type: ' + that.type);
      }
    };

    if (!this.data) {
      const exclusion = createDefinedByExclusion(this.model);
      this.data = fetch().then(data => _.filter(data, item => !exclusion(item)));
    }

    return this.data;
  };

  valueExtractor = (item: DataType) => item.id;
}
