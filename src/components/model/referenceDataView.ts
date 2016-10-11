import { IScope } from 'angular';
import { module as mod }  from './module';
import { ModelService } from '../../services/modelService';
import { ViewReferenceDataModal } from './viewReferenceDataModal';
import { ReferenceData, ReferenceDataCode } from '../../entities/referenceData';
import { LanguageContext } from '../../entities/contract';

mod.directive('referenceDataView', () => {
  return {
    scope: {
      referenceData: '=',
      context: '=',
      title: '@',
      showCodes: '='
    },
    restrict: 'E',
    template: require('./referenceDataView.html'),
    controllerAs: 'ctrl',
    bindToController: true,
    controller: ReferenceDataViewController
  };
});

class ReferenceDataViewController {

  referenceData: ReferenceData;
  context: LanguageContext;
  title: string;
  showCodes: boolean;
  codes: ReferenceDataCode[];

  constructor($scope: IScope, modelService: ModelService, private viewReferenceDataModal: ViewReferenceDataModal) {
    $scope.$watch(() => this.referenceData, referenceData => {
      if (referenceData && !referenceData.isExternal()) {
        modelService.getReferenceDataCodes(referenceData)
          .then(values => this.codes = values);
      } else {
        this.codes = [];
      }
    });
  }

  browse() {
    if (this.referenceData.isExternal()) {
      window.open(this.referenceData.id.uri, '_blank');
    } else {
      this.viewReferenceDataModal.open(this.referenceData, this.context);
    }
  }
}
