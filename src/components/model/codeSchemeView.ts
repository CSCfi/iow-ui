import IAttributes = angular.IAttributes;
import IScope = angular.IScope;
import { ReferenceData, CodeValue, LanguageContext } from '../../services/entities';
import { module as mod }  from './module';
import { ModelService } from '../../services/modelService';
import { ViewCodeSchemeModal } from './viewCodeSchemeModal';

mod.directive('codeSchemeView', () => {
  return {
    scope: {
      codeScheme: '=',
      context: '=',
      title: '@',
      showValues: '='
    },
    restrict: 'E',
    template: require('./codeSchemeView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: CodeSchemeViewController
  };
});

class CodeSchemeViewController {

  codeScheme: ReferenceData;
  context: LanguageContext;
  title: string;
  values: CodeValue[];

  constructor($scope: IScope, modelService: ModelService, private viewCodeSchemeModal: ViewCodeSchemeModal) {
    $scope.$watch(() => this.codeScheme, codeScheme => {
      if (codeScheme && !codeScheme.isExternal()) {
        modelService.getCodeValues(codeScheme)
          .then(values => this.values = values);
      } else {
        this.values = [];
      }
    });
  }

  browse() {
    if (this.codeScheme.isExternal()) {
      window.open(this.codeScheme.id.uri, '_blank');
    } else {
      this.viewCodeSchemeModal.open(this.codeScheme, this.context);
    }
  }
}
