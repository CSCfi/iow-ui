const _ = require('lodash');

module.exports = function modalFactory($uibModal) {
  'ngInject';

  return {
    open(defineConceptTitle, conceptLabel) {
      return $uibModal.open({
        template: require('./addConceptModal.html'),
        size: 'small',
        controller: AddConceptController,
        controllerAs: 'ctrl',
        resolve: {
          defineConceptTitle: () => defineConceptTitle,
          conceptLabel: () => conceptLabel
        }
      });
    }
  };
};

function AddConceptController($uibModalInstance, defineConceptTitle, conceptLabel) {
  'ngInject';

  const vm = this;
  vm.conceptLabel = conceptLabel;
  vm.defineConceptTitle = defineConceptTitle;

  vm.create = () => {
    $uibModalInstance.close(
      {
        concept: {
          label: vm.conceptLabel,
          comment: vm.conceptComment
        },
        label: vm.label
      }
    );
  };

  vm.cancel = () => {
    $uibModalInstance.dismiss();
  };
}
