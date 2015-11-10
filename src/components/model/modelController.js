const _ = require('lodash');
const utils = require('../../services/utils');

module.exports = function modelController($log, $q, $uibModal, $location, newModel, existingModelId, selected, modelService, classService, predicateService, userService, searchClassModal, searchPredicateModal, editInProgressModal, languageService) {
  'ngInject';

  const vm = this;
  let selectionView;
  let modelView;

  vm.loading = true;
  vm.modelSaved = true;
  vm.activeTab = selected ? {[selected.type]: true} : {class: true};
  vm.modelCreated = modelCreated;
  vm.isModelSaved = isModelSaved;
  vm.reload = reload;
  vm.registerModelView = initialize;
  vm.registerSelectionView = registerSelectionView;
  vm.getModel = getModel;
  vm.select = select;
  vm.isSelected = isSelected;
  vm.canEdit = userService.isLoggedIn;
  vm.addClass = addClass;
  vm.addPredicate = addPredicate;
  vm.glyphIconClassForType = utils.glyphIconClassForType;
  vm.associations = () => _.filter(vm.predicates, predicate => predicate.isAssociation());
  vm.attributes = () => _.filter(vm.predicates, predicate => predicate.isAttribute());

  function initialize(view) {
    modelView = view;
    if (existingModelId) {
      $q.all({model: modelService.getModelByUrn(existingModelId), selectable: fetchSelectable(existingModelId)}).then(result => {
        modelView.select(result.model, false);
        vm.loading = false;
      });
    } else if (newModel) {
      modelService.newModel(newModel.prefix, newModel.label, languageService.getModelLanguage()).then(model => {
        modelView.select(model, true, newModel.groupId);
        vm.loading = false;
      });
    } else {
      throw new Error('no existing selection or new model');
    }
  }

  function modelCreated(model) {
    if (model) {
      fetchSelectable(model.id);
      $location.search({urn: model.id});
    } else {
      $location.path('/groups');
      $location.search({urn: newModel.groupId});
    }
  }

  function registerSelectionView(view) {
    selectionView = view;
    if (selected) {
      selectByTypeAndId(selected.type, selected.id);
    }
  }

  function isModelSaved() {
    return modelView && !modelView.unsaved;
  }

  function getModel() {
    return modelView && modelView.model;
  }

  function isSelected(listItem) {
    const selection = selectionView.selection;
    if (selection) {
      return selection.isEqual(listItem);
    }
  }

  function setLocationForSelection(selection) {
    const model = getModel();
    if (model) {
      if (selection) {
        $location.search({urn: model.id, [selection.type]: selection.id});
      } else {
        $location.search({urn: model.id});
      }
    }
  }

  function reload() {
    fetchSelectable(getModel().id);
    setLocationForSelection(selectionView.selection);
  }

  function addClass() {
    const classMap = _.indexBy(vm.classes, klass => klass.id);
    searchClassModal.open(getModel().references, classMap).result
      .then(result => {
        if (typeof result === 'object') {
          createClass(result);
        } else {
          assignClassToModel(result);
        }
      });
  }

  function createClass(conceptData) {
    classService.newClass(getModel().context, getModel().id, conceptData.label, conceptData.conceptId, languageService.getModelLanguage())
      .then(klass => updateSelectionView(klass, true));
  }

  function assignClassToModel(classId) {
    const modelId = getModel().id;
    classService.assignClassToModel(classId, modelId)
      .then(() => {
        selectByTypeAndId('class', classId);
        fetchClasses(modelId);
      });
  }

  function addPredicate(type) {
    const predicateMap = _.indexBy(vm.predicates, (predicate) => predicate.id);
    searchPredicateModal.open(getModel().references, type, predicateMap).result
      .then(result => {
        if (typeof result === 'object') {
          createPredicate(result);
        } else {
          assignPredicateToModel(result, type);
        }
      });
  }

  function createPredicate(conceptData) {
    predicateService.newPredicate(getModel().context, getModel().id, conceptData.label, conceptData.conceptId, conceptData.type, languageService.getModelLanguage())
      .then(predicate => updateSelectionView(predicate, true));
  }

  function assignPredicateToModel(predicateId, type) {
    const modelId = getModel().id;
    predicateService.assignPredicateToModel(predicateId, modelId)
      .then(() => {
        selectByTypeAndId(type, predicateId);
        fetchPredicates(modelId);
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

  function fetchSelectable(modelId) {
    return $q.all([fetchClasses(modelId), fetchPredicates(modelId)]);
  }

  function fetchClasses(modelId) {
    return classService.getClassesForModel(modelId).then(classes => {
      vm.classes = classes;
    }, err => {
      $log.error(err);
    });
  }

  function fetchPredicates(modelId) {
    return predicateService.getPredicatesForModel(modelId).then(predicates => {
      vm.predicates = predicates;
    }, err => {
      $log.error(err);
    });
  }
};
