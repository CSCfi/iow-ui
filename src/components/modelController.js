module.exports = function modelController($routeParams, $log, $q, modelService, classService, propertyService) {
  'ngInject';

  const modelId = $routeParams.urn;
  const vm = this;

  vm.loading = true;

  $q.all([fetchModel(), fetchClasses(), fetchProperties()]).then(() => vm.loading = false);

  vm.reload = () => {
    fetchModel();
    fetchClasses();
    fetchProperties();
  };

  vm.activateClass = (klass) => {
    clearAll();
    vm.activatedClassId = klass['@id'];
  };

  vm.isClassActivated = (klass) => {
    return vm.activatedClassId && vm.activatedClassId === klass['@id'];
  };

  vm.activateAttribute = (attribute) => {
    clearAll();
    vm.activatedAttributeId = attribute['@id'];
  };

  vm.isAttributeActivated = (attribute) => {
    return vm.activatedAttributeId && vm.activatedAttributeId === attribute['@id'];
  };

  vm.activateAssociation = (association) => {
    clearAll();
    vm.activatedAssociationId = association['@id'];
  };

  vm.isAssociationActivated = (association) => {
    return vm.activatedAssociationId && vm.activatedAssociationId === association['@id'];
  };

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
    return propertyService.getPropertiesForModel(modelId).then(data => {
      vm.attributes = data.attributes['@graph'];
      vm.associations = data.associations['@graph'];
    }, err => {
      $log.error(err);
    });
  }
};
