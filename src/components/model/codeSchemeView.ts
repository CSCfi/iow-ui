import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { Model, CodeScheme, CodeValue } from '../../services/entities';
import { module as mod }  from './module';
import { ModelService } from '../../services/modelService';

mod.directive('codeSchemeView', () => {
  return {
    scope: {
      codeScheme: '=',
      model: '='
    },
    restrict: 'E',
    template: require('./codeSchemeView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: CodeSchemeViewController
  };
});

class CodeSchemeViewController {

  codeScheme: CodeScheme;
  model: Model;
  values: CodeValue[];

  constructor($scope: IScope, modelService: ModelService) {
    $scope.$watch(() => this.codeScheme, codeScheme => {
      if (codeScheme) {
        modelService.getCodeValues(codeScheme)
          .then(values => this.values = values);
      }
    });
  }
}
