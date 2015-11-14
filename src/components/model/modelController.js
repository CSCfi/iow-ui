const _ = require('lodash');
const utils = require('../../services/utils');

module.exports = function modelController($scope, $location, $routeParams, $log, $q, $uibModal, locationService, modelService, classService, predicateService, userService, searchClassModal, searchPredicateModal, editInProgressModal, languageService) {
  'ngInject';

  const vm = this;
  const views = [];

  vm.loading = true;
  vm.registerView = view => views.push(view);
  vm.select = select;
  vm.isSelected = isSelected;
  vm.canEdit = userService.isLoggedIn;
  vm.addClass = addClass;
  vm.addPredicate = addPredicate;
  vm.glyphIconClassForType = utils.glyphIconClassForType;
  vm.associations = () => _.filter(vm.predicates, predicate => predicate.isAssociation());
  vm.attributes = () => _.filter(vm.predicates, predicate => predicate.isAttribute());

  init(routeData($routeParams));

  $scope.$on('$locationChangeSuccess', () => {
    if ($location.path() === '/models') {
      init(routeData($location.search()));
    }
  });

  $scope.$watch('ctrl.model', (newModel, oldModel) => {
    if (oldModel) {
      if (!newModel) {
        $location.path('/groups');
        $location.search({urn: $routeParams.group});
      } else {
        locationService.atModel(newModel, vm.selection);
      }
    }
  });

  $scope.$watch('ctrl.selection', (newSelection, oldSelection) => {
    if (oldSelection) {
      updateSelectables(vm.model.id);
      locationService.atModel(vm.model, newSelection);
    }
  });

  function routeData(params) {
    function newModel() {
      if (params.label && params.prefix && params.group) {
        return {label: params.label, prefix: params.prefix, groupId: params.group};
      }
    }

    function existingModelId() {
      return params.urn;
    }

    function selected() {
      for (const type of ['attribute', 'class', 'association']) {
        const id = params[type];
        if (id) {
          return {type, id};
        }
      }
    }

    return {newModel: newModel(), existingModelId: existingModelId(), selected: selected()};
  }

  function init({newModel, existingModelId, selected}) {
    vm.loading = true;
    const promises = [];

    if (selected && (!vm.selection || !vm.selection.isEqual(selected))) {
      promises.push(selectByTypeAndId(selected.type, selected.id));
    }

    if (existingModelId && (!vm.model || vm.model.id !== existingModelId)) {
      promises.push(updateModel(existingModelId));
      promises.push(updateSelectables(existingModelId));
    }

    if (newModel) {
      promises.push(modelService.newModel(newModel.prefix, newModel.label, newModel.groupId, languageService.getModelLanguage())
        .then(model => vm.model = model));
    }

    $q.all(promises).then(() => {
      locationService.atModel(vm.model, vm.selection);
      if (!selected && !vm.model.unsaved) {
        updateSelection(null);
      }
      vm.activeTab = selected ? {[selected.type]: true} : {class: true};
      vm.loading = false;
    });
  }

  function isSelected(listItem) {
    if (vm.selection) {
      return vm.selection.isEqual(listItem);
    }
  }

  function addClass() {
    const classMap = _.indexBy(vm.classes, klass => klass.id);
    searchClassModal.open(vm.model.references, classMap).result
      .then(result => {
        if (result.concept) {
          createClass(result.concept, result.label);
        } else {
          assignClassToModel(result);
        }
      });
  }

  function createClass(concept, label) {
    classService.newClass(vm.model, label, concept.id, languageService.getModelLanguage())
      .then(klass => updateSelection(klass, true));
  }

  function assignClassToModel(klass) {
    classService.assignClassToModel(klass.id, vm.model.id)
      .then(() => {
        selectByTypeAndId('class', klass.id);
        updateClasses(vm.model.id);
      });
  }

  function addPredicate(type) {
    const predicateMap = _.indexBy(vm.predicates, (predicate) => predicate.id);
    searchPredicateModal.open(vm.model.references, type, predicateMap).result
      .then(result => {
        if (result.concept) {
          createPredicate(result.concept, result.label, result.type);
        } else {
          assignPredicateToModel(result, type);
        }
      });
  }

  function createPredicate(concept, label, type) {
    predicateService.newPredicate(vm.model, label, concept.id, type, languageService.getModelLanguage())
      .then(predicate => updateSelection(predicate, true));
  }

  function assignPredicateToModel(predicate, type) {
    predicateService.assignPredicateToModel(predicate.id, vm.model.id)
      .then(() => {
        selectByTypeAndId(type, predicate.id);
        updatePredicates(vm.model.id);
      });
  }

  function select(listItem) {
    selectByTypeAndId(listItem.type, listItem.id);
  }

  function selectByTypeAndId(type, id) {
    if (type === 'class') {
      return selectClassById(id);
    } else {
      return selectPredicateById(id);
    }
  }

  function selectClassById(id) {
    return classService.getClass(id).then(updateSelection);
  }

  function selectPredicateById(id) {
    return predicateService.getPredicate(id).then(updateSelection);
  }

  function updateSelection(selection) {
    askPermissionWhenEditing(() => {
      vm.selection = selection;
      locationService.atModel(vm.model, selection);
    });
  }

  function askPermissionWhenEditing(callback) {
    const editingViews = _.filter(views, view => view.isEditing());

    if (editingViews.length > 0) {
      editInProgressModal.open().result.then(() => {
        _.forEach(editingViews, view => view.cancelEditing());
        callback();
      });
    } else {
      callback();
    }
  }

  function updateModel(modelId) {
    return modelService.getModelByUrn(modelId).then(model => vm.model = model);
  }

  function updateSelectables(modelId) {
    return $q.all([updateClasses(modelId), updatePredicates(modelId)]);
  }

  function updateClasses(modelId) {
    return classService.getClassesForModel(modelId).then(classes => vm.classes = classes);
  }

  function updatePredicates(modelId) {
    return predicateService.getPredicatesForModel(modelId).then(predicates => vm.predicates = predicates);
  }
};
