const _ = require('lodash');
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
  vm.associations = () => _.filter(vm.predicates, predicate => predicate.isAssociation());
  vm.attributes = () => _.filter(vm.predicates, predicate => predicate.isAttribute());

  function isSelected(listItem) {
    const selection = selectionView.selection;
    if (selection) {
      return selection.isEqual(listItem);
    }
  }

  function setLocationForSelection(selection) {
    if (selection) {
      $location.search({urn: modelId, [selection.type]: selection.id});
    } else {
      $location.search({urn: modelId});
    }
  }

  function reload() {
    fetchAll();
    setLocationForSelection(selectionView.selection);
  }

  function addClass() {
    const classMap = _.indexBy(vm.classes, klass => klass.id);
    searchClassModal.open(vm.model.references, classMap).result
      .then(result => {
        if (typeof result === 'object') {
          createClass(result);
        } else {
          assignClassToModel(result);
        }
      });
  }

  function createClass(conceptData) {
    classService.newClass(vm.model.context, modelId, conceptData.label, conceptData.conceptId, modelLanguage.getLanguage())
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
    const predicateMap = _.indexBy(vm.predicates, (predicate) => predicate.id);
    searchPredicateModal.open(vm.model.references, type, predicateMap).result
      .then(result => {
        if (typeof result === 'object') {
          createPredicate(result);
        } else {
          assignPredicateToModel(result, type);
        }
      });
  }

  function createPredicate(conceptData) {
    predicateService.newPredicate(vm.model.context, modelId, conceptData.label, conceptData.conceptId, conceptData.type, modelLanguage.getLanguage())
      .then(predicate => updateSelectionView(predicate, true));
  }

  function assignPredicateToModel(predicateId, type) {
    predicateService.assignPredicateToModel(predicateId, modelId)
      .then(() => {
        selectByTypeAndId(type, predicateId);
        fetchPredicates();
      });
  }

  function select(listItem) {
    selectByTypeAndId(listItem.type, listItem.id);
  }

  function selectByTypeAndId(type, id) {
    if (type === 'class') {
      selectClassById(id);
    } else {
      selectPredicateById(id);
    }
  }

  function selectClassById(id) {
    classService.getClass(id).then(updateSelectionView);
  }

  function selectPredicateById(id) {
    predicateService.getPredicate(id).then(updateSelectionView);
  }

  function updateSelectionView(selection, unsaved) {
    askPermissionWhenEditing(() => {
      selectionView.select(selection, unsaved);
      setLocationForSelection(selection);
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
    return modelService.getModelByUrn(modelId).then(model => {
      vm.model = model;
    }, err => {
      $log.error(err);
    });
  }

  function fetchClasses() {
    return classService.getClassesForModel(modelId).then(classes => {
      vm.classes = classes;
    }, err => {
      $log.error(err);
    });
  }

  function fetchPredicates() {
    return predicateService.getPredicatesForModel(modelId).then(predicates => {
      vm.predicates = predicates;
    }, err => {
      $log.error(err);
    });
  }
};
