module.exports = function modalFactory($uibModal) {
  'ngInject';

  return {
    open(language) {
      return $uibModal.open({
        template: require('./addRequireModal.html'),
        size: 'small',
        controller: AddRequireController,
        controllerAs: 'ctrl',
        resolve: {
          language: () => language
        }
      });
    }
  };
};

function AddRequireController($uibModalInstance, language, modelService) {
  'ngInject';

  const vm = this;

  vm.create = () => {
    modelService.newRequire(vm.namespace, vm.prefix, vm.label, language)
      .then($uibModalInstance.close, err => vm.submitError = true);
  };

  vm.cancel = () => {
    $uibModalInstance.dismiss();
  };
}
