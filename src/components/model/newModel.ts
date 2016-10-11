import { IScope, ILocationService } from 'angular';
import { module as mod }  from './module';
import { ModelService } from '../../services/modelService';
import { Uri } from '../../services/uri';
import { Language } from '../../utils/language';
import { KnownModelType } from '../../entities/type';
import { Model } from '../../entities/model';

mod.directive('newModel', () => {
  return {
    restrict: 'E',
    scope: {
      prefix: '=',
      label: '=',
      group: '=',
      languages: '=',
      type: '=',
      redirect: '='
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
  type: KnownModelType;
  redirect: Uri;

  loading: boolean;
  model: Model;

  /* @ngInject */
  constructor($scope: IScope,
              $location: ILocationService,
              modelService: ModelService) {

    modelService.newModel(this.prefix, this.label, this.group, this.languages, this.type, this.redirect)
      .then(model => this.model = model)
      .then(() => this.loading = false);

    $scope.$watch(() => this.model, (newModel: Model, oldModel: Model) => {
      // new model creation cancelled
      if (oldModel && !newModel) {
        $location.url(oldModel.group.iowUrl());
      }

      if (newModel && !newModel.unsaved) {
        $location.url(newModel.iowUrl());
      }
    });
  }
}
