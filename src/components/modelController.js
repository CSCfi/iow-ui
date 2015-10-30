const _ = require('lodash');

module.exports = function modelController($routeParams, $log, $q, $uibModal, $location, modelService, classService, predicateService, userService, searchClassModal, editInProgressModal) {
  'ngInject';

  const modelId = $routeParams.urn;
  const views = [];
  const vm = this;

  vm.loading = true;

  $q.all([fetchModel(), fetchClasses(), fetchProperties()]).then(() => {
    vm.loading = false;

    // load possible state from route
    ['attribute', 'class', 'association'].map(function(key) {
      const value = $routeParams[key];
      if (value) {
        vm['activate' + _.capitalize(key)](value);
      }
    });
  });

  vm.reload = () => {
    fetchModel();
    fetchClasses();
    fetchProperties();
  };

  vm.registerView = (view) => {
    views.push(view);
  };

  vm.activateClass = (classId) => {
    askPermissionWhenEditing(() => {
      clearAll();
      vm.activatedClassId = classId;
      $location.search({urn: modelId, class: classId});
    });
  };

  vm.activateAttribute = (attributeId) => {
    askPermissionWhenEditing(() => {
      clearAll();
      vm.activatedAttributeId = attributeId;
      $location.search({urn: modelId, attribute: attributeId});
    });
  };

  vm.activateAssociation = (associationId) => {
    askPermissionWhenEditing(() => {
      clearAll();
      vm.activatedAssociationId = associationId;
      $location.search({urn: modelId, association: associationId});
    });
  };

  vm.isClassActivated = (klass) => vm.activatedClassId && vm.activatedClassId === klass['@id'];
  vm.isAttributeActivated = (attribute) => vm.activatedAttributeId && vm.activatedAttributeId === attribute['@id'];
  vm.isAssociationActivated = (association) => vm.activatedAssociationId && vm.activatedAssociationId === association['@id'];

  vm.isLoggedIn = userService.isLoggedIn;

  vm.addClass = () => {
    const classIds = _.map(vm.classes, klass => klass['@id']);
    searchClassModal.open(classIds).result.then(classId => {
      classService.assignClassToModel(classId, modelId).then(() => {
        vm.activateClass(classId);
        fetchClasses();
      });
    });
  };

  function askPermissionWhenEditing(callback) {
    if (isEditing()) {
      editInProgressModal.open().result.then(callback);
    } else {
      callback();
    }
  }

  function isEditing() {
    return _.find(views, view => view.isEditing());
  }

  function clearAll() {
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
    return predicateService.getPredicatesForModel(modelId).then(data => {
      vm.attributes = data.attributes['@graph'];
      vm.associations = data.associations['@graph'];
    }, err => {
      $log.error(err);
    });
  }
};
