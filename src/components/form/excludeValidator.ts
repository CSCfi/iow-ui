import { module as mod } from './module';
import { IScope, IAttributes, INgModelController, IQService, IPromise } from 'angular';
import { Uri } from '../../services/uri';

interface ExcludeValidatorAttributes extends IAttributes {
  excludeValidator: string;
}

export type IdExclude = (id: Uri) => string;

mod.directive('excludeValidator', ($q: IQService) => {
  return {
    restrict: 'A',
    require: 'ngModel',
    link($scope: IScope, element: JQuery, attributes: ExcludeValidatorAttributes, ngModel: INgModelController) {

      $scope.$watch(attributes.excludeValidator, (excludeProvider: () => (id: Uri) => IPromise<string>) => {
        if (excludeProvider) {
          const exclude = excludeProvider();
          // TODO show exclude based dynamic validation errors in the errorMessages panel
          ngModel.$asyncValidators['exclude'] = (id: Uri) => {
            return exclude(id).then(excludeReason => excludeReason ? $q.reject() : true);
          };
        } else {
          delete ngModel.$asyncValidators['exclude'];
        }
      });
    }
  };
});
