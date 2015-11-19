module.exports = function modalFactory($uibModal) {
  'ngInject';

  return {
    open(defineConceptTitle, conceptLabel, reference) {
      return $uibModal.open({
        template: require('./addConceptModal.html'),
        size: 'small',
        controller: AddConceptController,
        controllerAs: 'ctrl',
        backdrop: false,
        resolve: {
          defineConceptTitle: () => defineConceptTitle,
          conceptLabel: () => conceptLabel,
          reference: () => reference
        }
      });
    }
  };
};

function AddConceptController($scope, $uibModalInstance, defineConceptTitle, conceptLabel, reference) {
  'ngInject';

  const vm = this;
  vm.conceptLabel = conceptLabel;
  vm.defineConceptTitle = defineConceptTitle;
  vm.reference = reference;

  $scope.$watch('ctrl.conceptLabel', label => vm.label = label);

  vm.create = () => {
    $uibModalInstance.close(
      {
        concept: {
          label: vm.conceptLabel,
          comment: vm.conceptComment,
          schemeId: reference.id
        },
        label: vm.label
      }
    );
  };

  vm.cancel = () => {
    $uibModalInstance.dismiss();
  };
}
