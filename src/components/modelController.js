const _ = require('lodash');
const graphUtils = require('../services/graphUtils');

module.exports = function modelController($log, $q, $uibModal, $location, modelId, selected, modelService, classService, classCreatorService, predicateService, predicateCreatorService, userService, searchClassModal, searchPredicateModal, editInProgressModal, modelLanguage) {
  'ngInject';

  const vm = this;

  let classView;
  let predicateView;
  let modelContext;

  vm.loading = true;

  fetchAll().then(() => vm.loading = false);

  vm.activeTab = selected ? {[selected.type]: true} : {class: true};
  vm.reload = reload;
  vm.registerClassView = (view) => {
    classView = view;
    if (selected && selected.type === 'class') {
      selectClass(selected.id);
    }
  };
  vm.registerPredicateView = (view) => {
    predicateView = view;
    if (selected && selected.type !== 'class') {
      selectPredicate(selected.id, selected.type);
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
      $location.search({urn: modelId, [mapType(graphUtils.type(selection))]: graphUtils.withFullId(selection)});
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
    classCreatorService.createClass(modelContext, modelId, conceptData.label, conceptData.conceptId, modelLanguage.getLanguage()).then(klass => {
      classService.addUnsavedClass(klass, modelContext);
      const classId = graphUtils.withFullId(klass);
      selectByTypeAndId('class', classId);
    });
  }

  function assignClassToModel(classId) {
    classService.assignClassToModel(classId, modelId).then(() => {
      selectByTypeAndId('class', classId);
      fetchClasses();
    });
  }

  function createPredicate(conceptData) {
    predicateCreatorService.createPredicate(vm.context, modelId, conceptData.label, conceptData.conceptId, conceptData.type, modelLanguage.getLanguage()).then(predicate => {
      predicateService.addUnsavedPredicate(predicate, modelContext);
      const predicateId = graphUtils.withFullId(predicate);
      selectByTypeAndId(mapType(conceptData.type), predicateId);
    });
  }

  function assignPredicateToModel(predicateId, type) {
    predicateService.assignPredicateToModel(predicateId, modelId).then(() => {
      selectByTypeAndId(mapType(type), predicateId);
      fetchPredicates();
    });
  }

  function isSelected(obj) {
    const id = obj['@id'];
    const type = mapType(obj['@type']);

    if (type === 'class') {
      return id === classView.getSelectionId();
    } else {
      return id === predicateView.getSelectionId();
    }
  }

  function select(obj) {
    selectByTypeAndId(mapType(obj['@type']), obj['@id']);
  }

  function selectByTypeAndId(type, id) {
    if (type === 'class') {
      selectClass(id);
    } else {
      selectPredicate(id, type);
    }
  }

  function selectClass(id) {
    askPermissionWhenEditing((editing) => {
      if (editing) {
        cancelEditing();
      }
      classService.getClass(id).then(klass => {
        classView.selectClass(klass, klass.unsaved);
        predicateView.selectPredicate(null);
        $location.search({urn: modelId, 'class': id});
      });
    });
  }

  function selectPredicate(id, type) {
    askPermissionWhenEditing((editing) => {
      if (editing) {
        cancelEditing();
      }
      predicateService.getPredicateById(id, type + 'Frame').then(predicate => {
        predicateView.selectPredicate(predicate, predicate.unsaved);
        classView.selectClass(null);
        $location.search({urn: modelId, [type]: id});
      });
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
      vm.model = data['@graph'][0];
      modelContext = data['@context'];
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

  function mapType(type) {
    if (type === 'sh:ShapeClass') {
      return 'class';
    } else if (type === 'owl:DatatypeProperty') {
      return 'attribute';
    } else if (type === 'owl:ObjectProperty') {
      return 'association';
    } else {
      throw new Error('Unknown type: ' + type);
    }
  }
};
