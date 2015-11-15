module.exports = function modalFactory($uibModal) {
  'ngInject';

  function open(title, body) {
    return $uibModal.open({
      template: `<modal-template>
                   <modal-title>{{ctrl.title | translate}}</modal-title>
                   <modal-body>{{ctrl.body | translate}}</modal-body>
                 </modal-template>`,
      controllerAs: 'ctrl',
      controller() {
        this.title = title;
        this.body = body;
      }
    });
  }

  return {
    open: open,
    openEditInProgress: () => open('Edit in progress', 'Are you sure that you want to cancel edit?'),
    openDeleteConfirm: () => open('Confirm delete', 'Are you sure that you want to delete?')
  };
};
