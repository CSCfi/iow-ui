const name = 'iow.components.editor';
const mod = angular.module(name, []);
module.exports = name;

mod.factory('addConceptModal', require('./addConceptModal'));
mod.directive('classForm', require('./classForm'));
mod.directive('classSelect', require('./classSelect'));
mod.directive('classView', require('./classView'));
mod.directive('classVisualization', require('./classVisualization'));
mod.directive('editableSubjectSelect', require('./editableSubjectSelect'));
mod.directive('predicateForm', require('./predicateForm'));
mod.directive('predicateSelect', require('./predicateSelect'));
mod.directive('predicateView', require('./predicateView'));
mod.directive('predicateVisualizaion', require('./predicateVisualization'));
mod.directive('propertyView', require('./propertyView'));
mod.factory('searchClassModal', require('./searchClassModal'));
mod.factory('searchConceptModal', require('./searchConceptModal'));
mod.factory('searchPredicateModal', require('./searchPredicateModal'));
mod.directive('rangeSelect', require('./rangeSelect'));
mod.directive('selectionView', require('./selectionView'));

