const _ = require('lodash');
const Bloodhound = require('typeahead.js-browserify').Bloodhound;

module.exports = function modalFactory($uibModal) {
  'ngInject';

  return {
    open(defineConceptTitle) {
      return $uibModal.open({
        template: require('./templates/searchConceptModal.html'),
        size: 'small',
        controller: SearchClassController,
        controllerAs: 'ctrl',
        resolve: {
          defineConceptTitle: () => defineConceptTitle
        }
      });
    }
  };
};

function SearchClassController($scope, $uibModalInstance, modelLanguage, gettextCatalog, defineConceptTitle) {
  'ngInject';

  const vm = this;

  vm.concept = null;
  vm.label = null;
  vm.defineConceptTitle = defineConceptTitle;

  vm.options = {
    hint: false,
    highlight: true,
    minLength: 3,
    editable: false
  };

  $scope.$watch('ctrl.concept', (concept) => {
    if (concept) {
      vm.label = concept.prefLabel;
    }
  });

  function identify(obj) {
    return obj.uri;
  }

  function limitResults(results) {
    return results.splice(0, Math.min(2000, results.length));
  }

  const conceptEngine = new Bloodhound({
    identify: identify,
    remote: {
      url: `/api/rest/conceptSearch?term=%QUERY&lang=${modelLanguage.getLanguage()}&vocid=undefined`,
      wildcard: '%QUERY',
      transform: (response) => _.uniq(limitResults(response.results), identify)
    },
    rateLimitBy: 'debounce',
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    datumTokenizer: Bloodhound.tokenizers.whitespace
  });

  vm.datasets = {
    display: 'prefLabel',
    name: 'concept',
    source: conceptEngine,
    templates: {
      empty: (search) => `<div class="empty-message">'${search.query}' ${gettextCatalog.getString('not found in the concept database')}</div>`,
      suggestion: (data) => `<div>${data.prefLabel} <p class="details">${data.uri}</p></div>`
    }
  };

  vm.create = () => {
    $uibModalInstance.close({conceptId: vm.concept.uri, label: vm.label});
  };

  vm.cancel = () => {
    $uibModalInstance.dismiss();
  };
}
