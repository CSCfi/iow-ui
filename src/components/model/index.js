const name = 'iow.components.model';
const mod = angular.module(name, []);
module.exports = name;

mod.controller('modelController', require('./modelController'));

mod.directive('modelView', require('./modelView'));
mod.directive('referencesView', require('./referencesView'));
mod.directive('requiresView', require('./requiresView'));
mod.directive('selectionView', require('./selectionView'));
mod.directive('classForm', require('./classForm'));
mod.directive('predicateForm', require('./predicateForm'));
mod.directive('propertyView', require('./propertyView'));
mod.directive('propertyPredicateView', require('./propertyPredicateView'));
mod.directive('rangeSelect', require('./rangeSelect'));
mod.directive('stateSelect', require('./stateSelect'));
mod.directive('classSelect', require('./classSelect'));
mod.directive('editableSubjectSelect', require('./editableSubjectSelect'));

mod.factory('searchPredicateModal', require('./searchPredicateModal'));
mod.factory('searchClassModal', require('./searchClassModal'));
mod.factory('addConceptModal', require('./addConceptModal'));
mod.factory('searchConceptModal', require('./searchConceptModal'));
mod.factory('searchSchemeModal', require('./searchSchemeModal'));

