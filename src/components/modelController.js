const _ = require('lodash');
const graphUtils = require('../services/graphUtils');

module.exports = function modelController($log, $q, $uibModal, $location, modelId, selected, modelService, classService, classCreatorService, predicateService, predicateCreatorService, userService, searchClassModal, searchPredicateModal, editInProgressModal, modelLanguage) {
  'ngInject';

  const vm = this;

  let classView;
  let predicateView;

  vm.loading = true;

  fetchAll().then(() => vm.loading = false);

  vm.activeTab = selected ? {[selected.type]: true} : {class: true};
  vm.reload = reload;
  vm.registerClassView = (view) => {
    classView = view;
    if (selected && selected.type === 'class') {
      selectClassById(selected.id);
    }
  };
  vm.registerPredicateView = (view) => {
    predicateView = view;
    if (selected && selected.type !== 'class') {
      selectPredicateByIdAndType(selected.id, selected.type);
    }
  };
  vm.select = select;
  vm.isSelected = isSelected;
  vm.isLoggedIn = userService.isLoggedIn;
  vm.addClass = addClass;
  vm.addPredicate = addPredicate;
  vm.modelId = modelId;

  function reload() {
    fetchAll();
    const selection = classView.class || predicateView.predicate;
    if (selection) {
      $location.search({urn: modelId, [graphUtils.type(selection)]: graphUtils.withFullId(selection)});
    } else {
      $location.search({urn: modelId});
    }
  }

  function addClass() {
    const classMap = _.indexBy(vm.classes, klass => klass['@id']);
    searchClassModal.open(classMap).result.then(result => {
      if (typeof result === 'object') {
        createClass(result);
      } else {
        assignClassToModel(result);
      }
    });
  }

  function addPredicate(type) {
    const predicateMap = _.indexBy(vm.associations.concat(vm.attributes), (predicate) => predicate['@id']);
    searchPredicateModal.open(type, predicateMap).result.then(result => {
      if (typeof result === 'object') {
        createPredicate(result);
      } else {
        assignPredicateToModel(result, type);
      }
    });
  }

  function createClass(conceptData) {
    classCreatorService.createClass(vm.model['@context'], modelId, conceptData.label, conceptData.conceptId, modelLanguage.getLanguage())
      .then(klass => selectClass(klass, true));
  }

  function assignClassToModel(classId) {
    classService.assignClassToModel(classId, modelId).then(() => {
      selectByTypeAndId('class', classId);
      fetchClasses();
    });
  }

  function createPredicate(conceptData) {
    predicateCreatorService.createPredicate(vm.model['@context'], modelId, conceptData.label, conceptData.conceptId, conceptData.type, modelLanguage.getLanguage())
      .then(predicate => selectPredicate(predicate, true));
  }

  function assignPredicateToModel(predicateId, type) {
    predicateService.assignPredicateToModel(predicateId, modelId).then(() => {
      selectByTypeAndId(graphUtils.asTypeString(type), predicateId);
      fetchPredicates();
    });
  }

  function isSelected(obj) {
    const id = obj['@id'];
    const type = graphUtils.asTypeString(obj['@type']);

    if (type === 'class') {
      return id === classView.getSelectionId();
    } else {
      return id === predicateView.getSelectionId();
    }
  }

  function select(obj) {
    selectByTypeAndId(graphUtils.asTypeString(obj['@type']), obj['@id']);
  }

  function selectByTypeAndId(type, id) {
    if (type === 'class') {
      selectClassById(id);
    } else {
      selectPredicateByIdAndType(id, type);
    }
  }

  function selectClassById(id) {
    classService.getClass(id).then(selectClass);
  }

  function selectClass(klass, unsaved) {
    askPermissionWhenEditing(() => {
      classView.selectClass(klass, unsaved);
      predicateView.selectPredicate(null);
      $location.search({urn: modelId, 'class': graphUtils.withFullId(klass)});
    });
  }

  function selectPredicateByIdAndType(id, type) {
    predicateService.getPredicateById(id, type + 'Frame').then(selectPredicate);
  }

  function selectPredicate(predicate, unsaved) {
    askPermissionWhenEditing(() => {
      predicateView.selectPredicate(predicate, unsaved);
      classView.selectClass(null);
      $location.search({urn: modelId, [graphUtils.type(predicate)]: graphUtils.withFullId(predicate)});
    });
  }

  function askPermissionWhenEditing(callback) {
    if (isEditing()) {
      editInProgressModal.open().result.then(() => {
        cancelEditing();
        callback();
      });
    } else {
      callback();
    }
  }

  function cancelEditing() {
    classView.cancelEditing(false);
    predicateView.cancelEditing(false);
  }

  function isEditing() {
    return (classView && classView.isEditing()) || (predicateView && predicateView.isEditing());
  }

  function fetchAll() {
    return $q.all([fetchModel(), fetchClasses(), fetchPredicates()]);
  }

  function fetchModel() {
    return modelService.getModelByUrn(modelId).then(data => {
      vm.model = data;
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

  function fetchPredicates() {
    return predicateService.getPredicatesForModel(modelId).then(data => {
      vm.attributes = data.attributes['@graph'];
      vm.associations = data.associations['@graph'];
    }, err => {
      $log.error(err);
    });
  }
};
