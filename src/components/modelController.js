const _ = require('lodash');
const contextUtils = require('../services/contextUtils');

module.exports = function modelController($log, $q, $uibModal, $location, modelId, selected, modelService, classService, classCreatorService, predicateService, userService, searchClassModal, editInProgressModal) {
  'ngInject';

  const views = [];
  const vm = this;

  vm.loading = true;

  fetchAll().then(() => vm.loading = false);

  vm.selected = selected;
  vm.activeTab = selected ? {[selected.type]: true} : {class: true};
  vm.reload = fetchAll;
  vm.registerView = (view) => views.push(view);
  vm.select = select;
  vm.isSelected = (type, id) => _.isEqual(vm.selected, {type, id});
  vm.isLoggedIn = userService.isLoggedIn;

  vm.addClass = () => {
    const classIds = _.map(vm.classes, klass => klass['@id']);
    searchClassModal.open(classIds).result.then(result => {
      if (typeof result === 'object') {
        createClass(result);
      } else {
        assignClassToModel(result);
      }
    });
  };

  function assignClassToModel(classId) {
    classService.assignClassToModel(classId, modelId).then(() => {
      vm.select('class', classId);
      fetchClasses();
    });
  }

  function createClass(conceptData) {
    classCreatorService.createClass(modelId, conceptData.classLabel, conceptData.conceptId).then(response => {
      const classId = contextUtils.withFullIRI(response['@context'], response['@graph'][0]['@id']);
      classService.createClass(response, classId).then(() => {
        vm.select('class', classId);
        fetchClasses();
      });
    });
  }

  function select(type, id) {
    askPermissionWhenEditing((editing) => {
      if (editing) {
        cancelEditing();
      }
      vm.selected = {type, id};
      $location.search({urn: modelId, [type]: id});
    });
  }

  function askPermissionWhenEditing(callback) {
    if (isEditing()) {
      editInProgressModal.open().result.then(() => callback(true));
    } else {
      callback(false);
    }
  }

  function cancelEditing() {
    return _.forEach(views, view => view.cancelEditing());
  }

  function isEditing() {
    return _.find(views, view => view.isEditing());
  }

  function fetchAll() {
    return $q.all([fetchModel(), fetchClasses(), fetchProperties()]);
  }

  function fetchModel() {
    return modelService.getModelByUrn(modelId).then(data => {
      vm.model = data['@graph'][0];
    }, err => {
      $log.error(err);
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
