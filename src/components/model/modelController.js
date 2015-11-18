const _ = require('lodash');
const utils = require('../../services/utils');

module.exports = function modelController($scope, $location, $routeParams, $log, $q, $uibModal, locationService, modelService, classService, predicateService, userService, searchClassModal, searchPredicateModal, confirmationModal, languageService) {
  'ngInject';

  const vm = this;
  const views = [];

  vm.loading = true;
  vm.registerView = view => views.push(view);
  vm.selectionEdited = selectionEdited;
  vm.selectionDeleted = selectionDeleted;
  vm.select = select;
  vm.isSelected = listItem => listItem.isEqual(vm.selectedItem);
  vm.canEdit = userService.isLoggedIn;

  init(routeData($routeParams));

  function createTab(type, items, addNew) {
    return {
      type,
      items,
      label: _.capitalize(type) + ' list',
      addLabel: 'Add ' + type,
      glyphIconClass: utils.glyphIconClassForType(type),
      addNew,
      active: (vm.selectedItem && vm.selectedItem.type === type)
    };
  }

  vm.tabs = [createTab('class', () => vm.classes, addClass),
             createTab('attribute', () => _.filter(vm.predicates, predicate => predicate.isAttribute()), () => addPredicate('attribute')),
             createTab('association', () => _.filter(vm.predicates, predicate => predicate.isAssociation()), () => addPredicate('association'))];


  $scope.$on('$locationChangeSuccess', () => {
    if ($location.path() === '/models') {
      init(routeData($location.search()));
    }
  });

  $scope.$watch('ctrl.model', (newModel, oldModel) => {
    updateLocation();
    const isNewNewModelCreationCancelled = oldModel && !newModel;

    if (isNewNewModelCreationCancelled) {
      $location.path('/groups');
      $location.search({urn: $routeParams.group});
    }
  });

  $scope.$watch('ctrl.selection', updateLocation);

  function selectionDeleted(selection) {
    _.remove(vm.classes, item => item.isEqual(selection));
    _.remove(vm.predicates, item => item.isEqual(selection));
  }

  function selectionEdited(oldSelection, newSelection) {
    const listItem = _.find(vm.classes, item => item.isEqual(oldSelection)) ||
                     _.find(vm.predicates, item => item.isEqual(oldSelection));

    listItem.id = newSelection.id;
    listItem.label = newSelection.label;
    vm.selectedItem = listItem;
  }

  function updateLocation() {
    if (vm.model) {
      locationService.atModel(vm.model, vm.selection);

      if (!vm.model.unsaved) {
        const newSearch = {urn: vm.model.id};
        if (vm.selection) {
          newSearch[vm.selection.type] = vm.selection.id;
        }

        const search = _.clone($location.search());
        delete search.property;

        if (!_.isEqual(search, newSearch)) {
          $location.search(newSearch);
        }
      }
    }
  }

  function routeData(params) {
    function newModel() {
      if (params.label && params.prefix && params.group) {
        return {label: params.label, prefix: params.prefix, groupId: params.group};
      }
    }

    function selected() {
      for (const type of ['attribute', 'class', 'association']) {
        const id = params[type];
        if (id) {
          return {type, id};
        }
      }
    }

    return {newModel: newModel(), existingModelId: params.urn, selected: selected()};
  }

  function init({newModel, existingModelId, selected}) {
    vm.selectedItem = selected;

    (newModel
      ? updateNewModel(newModel)
      : $q.all([
        updateModelById(existingModelId).then(updateSelectables),
        updateSelectionByTypeAndId(selected)
      ])
    ).then(() => vm.loading = false);
  }

  function addClass() {
    const classMap = _.indexBy(vm.classes, klass => klass.id);
    searchClassModal.open(vm.model.references, classMap).result
      .then(result => {
        if (result.concept) {
          createClass(result);
        } else {
          assignClassToModel(result);
        }
      });
  }

  function createClass({concept, label}) {
    classService.newClass(vm.model, label, concept.id, languageService.getModelLanguage())
      .then(klass => updateSelection(klass));
  }

  function assignClassToModel(klass) {
    classService.assignClassToModel(klass.id, vm.model.id)
      .then(() => {
        updateSelection(klass);
        updateClasses();
      });
  }

  function addPredicate(type) {
    const predicateMap = _.indexBy(vm.predicates, (predicate) => predicate.id);
    searchPredicateModal.open(vm.model.references, type, predicateMap).result
      .then(result => {
        if (result.concept) {
          createPredicate(result);
        } else {
          assignPredicateToModel(result);
        }
      });
  }

  function createPredicate({concept, label, type}) {
    predicateService.newPredicate(vm.model, label, concept.id, type, languageService.getModelLanguage())
      .then(predicate => updateSelection(predicate));
  }

  function assignPredicateToModel(predicate) {
    predicateService.assignPredicateToModel(predicate.id, vm.model.id)
      .then(() => {
        updateSelection(predicate);
        updatePredicates();
      });
  }

  let selectionQueue = [];

  function select(listItem) {
    askPermissionWhenEditing(() => {
      vm.selectedItem = listItem;
      if (selectionQueue.length > 0) {
        selectionQueue.push(listItem);
      } else {
        selectionQueue.push(listItem);
        fetchUntilStable(listItem).then(selection => {
          selectionQueue = [];
          updateSelection(selection);
        });
      }
    });

    function fetchUntilStable(item) {
      return fetchEntityByTypeAndId(item).then(entity => {
        const last = selectionQueue[selectionQueue.length - 1];
        if (entity.isEqual(last)) {
          return entity;
        } else {
          return fetchUntilStable(last);
        }
      });
    }
  }

  function askPermissionWhenEditing(callback) {
    const editingViews = _.filter(views, view => view.isEditing());

    if (editingViews.length > 0) {
      confirmationModal.openEditInProgress().result.then(() => {
        _.forEach(editingViews, view => view.cancelEditing());
        callback();
      });
    } else {
      callback();
    }
  }

  function updateSelectionByTypeAndId(selection) {
    if (selection) {
      return fetchEntityByTypeAndId(selection).then(updateSelection);
    } else {
      return $q.when(updateSelection(null));
    }
  }

  function fetchEntityByTypeAndId(selection) {
    if (!vm.selection || !vm.selection.isEqual(selection)) {
      return selection.type === 'class'
        ? classService.getClass(selection.id)
        : predicateService.getPredicate(selection.id);
    } else {
      return $q.when(vm.selection);
    }
  }

  function updateSelection(selection) {
    return $q.when(vm.selection = selection);
  }

  function updateModelById(modelId) {
    if (!vm.model || vm.model.id !== modelId) {
      return modelService.getModelByUrn(modelId).then(updateModel);
    } else {
      return $q.reject();
    }
  }

  function updateNewModel(newModel) {
    return modelService.newModel(newModel, languageService.getModelLanguage()).then(updateModel);
  }

  function updateModel(model) {
    return $q.when(vm.model = model);
  }

  function updateSelectables() {
    return $q.all([updateClasses(vm.model.id), updatePredicates(vm.model.id)]);
  }

  function updateClasses() {
    return classService.getClassesForModel(vm.model.id).then(classes => vm.classes = classes);
  }

  function updatePredicates() {
    return predicateService.getPredicatesForModel(vm.model.id).then(predicates => vm.predicates = predicates);
  }
};
