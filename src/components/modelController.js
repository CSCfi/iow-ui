const _ = require('lodash');
const contextUtils = require('../services/contextUtils');

module.exports = function modelController($log, $q, $uibModal, $location, modelId, selected, modelService, classService, classCreatorService, predicateService, predicateCreatorService, userService, searchClassModal, searchPredicateModal, editInProgressModal, modelLanguage) {
  'ngInject';

  const views = [];
  const vm = this;
  let modelContext;

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
    const classMap = _.indexBy(vm.classes, klass => klass['@id']);
    searchClassModal.open(classMap).result.then(result => {
      if (typeof result === 'object') {
        createClass(result);
      } else {
        assignClassToModel(result);
      }
    });
  };

  function createClass(conceptData) {
    classCreatorService.createClass(modelContext, modelId, conceptData.label, conceptData.conceptId, modelLanguage.getLanguage()).then(response => {
      const classId = contextUtils.withFullIRI(response['@context'], response['@graph'][0]['@id']);
      classService.createClass(response, classId).then(() => {
        vm.select('class', classId);
        fetchClasses();
      });
    });
  }

  function assignClassToModel(classId) {
    classService.assignClassToModel(classId, modelId).then(() => {
      vm.select('class', classId);
      fetchClasses();
    });
  }

  vm.addPredicate = (type) => {
    const predicateMap = _.indexBy(vm.associations.concat(vm.attributes), (predicate) => predicate['@id']);
    searchPredicateModal.open(type, predicateMap).result.then(result => {
      if (typeof result === 'object') {
        createPredicate(result);
      } else {
        assignPredicateToModel(result, type);
      }
    });
  };

  function owlTypeToType(owlType) {
    return owlType === 'owl:ObjectProperty' ? 'association' : 'attribute';
  }

  function createPredicate(conceptData) {
    predicateCreatorService.createPredicate(vm.context, modelId, conceptData.label, conceptData.conceptId, conceptData.type, modelLanguage.getLanguage()).then(predicate => {
      const predicateId = contextUtils.withFullIRI(predicate['@context'], predicate['@graph'][0]['@id']);
      predicateService.createPredicate(predicate, predicateId).then(() => {
        vm.select(owlTypeToType(conceptData.type), predicateId);
        fetchPredicates();
      });
    });
  }

  function assignPredicateToModel(predicateId, type) {
    predicateService.assignPredicateToModel(predicateId, modelId).then(() => {
      vm.select(owlTypeToType(type), predicateId);
      fetchPredicates();
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
    return _.forEach(views, view => view.cancelEditing(false));
  }

  function isEditing() {
    return _.find(views, view => view.isEditing());
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
};
