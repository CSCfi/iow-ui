import IScope = angular.IScope;
import ILocationService = angular.ILocationService;
import { module as mod }  from './module';
import { LanguageService } from '../../services/languageService';
import { ModelService } from '../../services/modelService';
import { Model, Type } from '../../services/entities';
import { Uri } from '../../services/uri';
import { Language } from '../../utils/language';

mod.directive('newModel', () => {
  return {
    restrict: 'E',
    scope: {
      prefix: '=',
      label: '=',
      group: '=',
      languages: '=',
      type: '='
    },
    template: require('./newModel.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: NewModelController
  };
});

export class NewModelController {

  prefix: string;
  label: string;
  group: Uri;
  languages: Language[];
  type: Type;

  loading: boolean;
  model: Model;

  /* @ngInject */
  constructor(private $scope: IScope,
              private $location: ILocationService,
              private modelService: ModelService,
              public languageService: LanguageService) {

    this.modelService.newModel(this.prefix, this.label, this.group, this.languages, this.type)
      .then(model => this.model = model)
      .then(() => this.loading = false);

    $scope.$watch(() => this.model, (newModel: Model, oldModel: Model) => {
      // new model creation cancelled
      if (oldModel && !newModel) {
        $location.path('/group');
        $location.search({urn: oldModel.groupId.uri});
      }

      if (newModel && !newModel.unsaved) {
        $location.url(newModel.iowUrl(false));
      }
    });
  }
}
