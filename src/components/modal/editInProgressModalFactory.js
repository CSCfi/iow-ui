module.exports = function modalFactory($uibModal) {
  'ngInject';

  return {
    open() {
      return $uibModal.open({
        template: require('./editInProgressModal.html'),
        controllerAs: 'ctrl',
        controller($uibModalInstance) {
          'ngInject';
          this.ok = () => {
            $uibModalInstance.close();
          };

          this.cancel = () => {
            $uibModalInstance.dismiss();
          };
        }
      });
    }
  };
};
