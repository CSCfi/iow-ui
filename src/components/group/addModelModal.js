module.exports = function modalFactory($uibModal) {
  'ngInject';

  return {
    open() {
      return $uibModal.open({
        template: require('./addModelModal.html'),
        size: 'small',
        controller: AddModelController,
        controllerAs: 'ctrl'
      });
    }
  };
};

function AddModelController($uibModalInstance) {
  'ngInject';

  const vm = this;

  vm.cancel = $uibModalInstance.dismiss;
  vm.create = () => {
    $uibModalInstance.close({prefix: vm.prefix, label: vm.label});
  };
}
