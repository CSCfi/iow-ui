const _ = require('lodash');
const graphUtils = require('../../services/graphUtils');
const utils = require('../../services/utils');

module.exports = function modelController($log, $q, $uibModal, $location, modelId, selected, modelService, classService, predicateService, userService, searchClassModal, searchPredicateModal, editInProgressModal, modelLanguage) {
  'ngInject';

  const vm = this;
  let selectionView;

  fetchAll().then(() => vm.loading = false);

  vm.loading = true;
  vm.modelId = modelId;
  vm.activeTab = selected ? {[selected.type]: true} : {class: true};
  vm.reload = reload;
  vm.registerSelectionView = (view) => {
    selectionView = view;
    if (selected) {
      selectByTypeAndId(selected.type, selected.id);
    }
  };
  vm.select = select;
  vm.isSelected = isSelected;
  vm.canEdit = userService.isLoggedIn;
  vm.addClass = addClass;
  vm.addPredicate = addPredicate;
  vm.glyphIconClassForType = utils.glyphIconClassForType;

  function isSelected(obj) {
    const id = obj['@id'];
    const type = graphUtils.asTypeString(obj['@type']);
    return _.isEqual({id, type}, graphUtils.asTypeAndId(selectionView.selection));
  }

  function reload() {
    fetchAll();
    const selection = graphUtils.asTypeAndId(selectionView.selection);
    if (selection) {
      $location.search({urn: modelId, [selection.type]: selection.id});
    } else {
      $location.search({urn: modelId});
    }
  }

  function addClass() {
    const classMap = _.indexBy(vm.classes, klass => klass['@id']);
    const references = graphUtils.graph(vm.model).references;
    searchClassModal.open(references, classMap).result
      .then(result => {
        if (typeof result === 'object') {
          createClass(result);
        } else {
          assignClassToModel(result);
        }
      });
  }

  function createClass(conceptData) {
    classService.getClassTemplate(vm.model['@context'], modelId, conceptData.label, conceptData.conceptId, modelLanguage.getLanguage())
      .then(klass => updateSelectionView(klass, true));
  }

  function assignClassToModel(classId) {
    classService.assignClassToModel(classId, modelId)
      .then(() => {
        selectByTypeAndId('class', classId);
        fetchClasses();
      });
  }

  function addPredicate(type) {
    const predicateMap = _.indexBy(vm.associations.concat(vm.attributes), (predicate) => predicate['@id']);
    const references = graphUtils.graph(vm.model).references;
    searchPredicateModal.open(references, type, predicateMap).result
      .then(result => {
        if (typeof result === 'object') {
          createPredicate(result);
        } else {
          assignPredicateToModel(result, type);
        }
      });
  }

  function createPredicate(conceptData) {
    predicateService.getPredicateTemplate(vm.model['@context'], modelId, conceptData.label, conceptData.conceptId, conceptData.type, modelLanguage.getLanguage())
      .then(predicate => updateSelectionView(predicate, true));
  }

  function assignPredicateToModel(predicateId, type) {
    predicateService.assignPredicateToModel(predicateId, modelId)
      .then(() => {
        selectByTypeAndId(graphUtils.asTypeString(type), predicateId);
        fetchPredicates();
      });
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
    classService.getClass(id).then(updateSelectionView);
  }

  function selectPredicateByIdAndType(id, type) {
    predicateService.getPredicate(id, type + 'Frame').then(updateSelectionView);
  }

  function updateSelectionView(selection, unsaved) {
    askPermissionWhenEditing(() => {
      selectionView.select(selection, unsaved);
      $location.search({urn: modelId, 'class': graphUtils.withFullId(selection)});
    });
  }

  function askPermissionWhenEditing(callback) {
    if (selectionView && selectionView.isEditing()) {
      editInProgressModal.open().result.then(() => {
        selectionView.cancelEditing(false);
        callback();
      });
    } else {
      callback();
    }
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
