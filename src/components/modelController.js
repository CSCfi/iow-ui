const _ = require('lodash');

module.exports = function modelController($routeParams, $log, $q, $uibModal, modelService, classService, propertyService) {
  'ngInject';

  const modelId = $routeParams.urn;
  const views = [];
  const vm = this;

  vm.loading = true;

  $q.all([fetchModel(), fetchClasses(), fetchProperties()]).then(() => vm.loading = false);

  vm.reload = () => {
    fetchModel();
    fetchClasses();
    fetchProperties();
  };

  vm.registerView = (view) => {
    views.push(view);
  };

  vm.activateClass = (klass) => {
    askPermissionWhenEditing(() => {
      clearAll();
      vm.activatedClassId = klass['@id'];
    });
  };

  vm.activateAttribute = (attribute) => {
    askPermissionWhenEditing(() => {
      clearAll();
      vm.activatedAttributeId = attribute['@id'];
    });
  };

  vm.activateAssociation = (association) => {
    askPermissionWhenEditing(() => {
      clearAll();
      vm.activatedAssociationId = association['@id'];
    });
  };

  vm.isClassActivated = (klass) => vm.activatedClassId && vm.activatedClassId === klass['@id'];
  vm.isAttributeActivated = (attribute) => vm.activatedAttributeId && vm.activatedAttributeId === attribute['@id'];
  vm.isAssociationActivated = (association) => vm.activatedAssociationId && vm.activatedAssociationId === association['@id'];

  function askPermissionWhenEditing(callback) {
    if (isEditing()) {
      $uibModal.open({
        template: require('./templates/cancelEditModal.html'),
        controllerAs: 'ctrl',
        controller($modalInstance) {
          'ngInject';
          this.ok = () => {
            cancelEditing();
            callback();
            $modalInstance.close();
          };

          this.cancel = () => {
            $modalInstance.close();
          };
        }
      });
    } else {
      callback();
    }
  }

  function isEditing() {
    return _.find(views, view => view.isEditing());
  }

  function cancelEditing() {
    return _.forEach(views, view => view.cancelEditing());
  }

  function clearAll() {
    cancelEditing();
    vm.activatedAttributeId = undefined;
    vm.activatedClassId = undefined;
    vm.activatedAssociationId = undefined;
  }

  function fetchModel() {
    return modelService.getModelByUrn(modelId).then(data => {
      vm.model = data['@graph'][0];
    });
  }

  function fetchClasses() {
    return classService.getClassesForModel(modelId).then(data => {
      vm.classes = data['@graph'];
    }, err => {
      $log.error(err);
    });
  }

  function fetchProperties() {
    return propertyService.getPropertiesForModel(modelId).then(data => {
      vm.attributes = data.attributes['@graph'];
      vm.associations = data.associations['@graph'];
    }, err => {
      $log.error(err);
    });
  }
};
