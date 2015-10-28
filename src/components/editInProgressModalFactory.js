module.exports = function modalFactory($uibModal) {
  'ngInject';

  return {
    open() {
      return $uibModal.open({
        template: require('./templates/editInProgressModal.html'),
        controllerAs: 'ctrl',
        controller($modalInstance) {
          'ngInject';
          this.ok = () => {
            $modalInstance.close();
          };

          this.cancel = () => {
            $modalInstance.dismiss();
          };
        }
      });
    }
  };
};
