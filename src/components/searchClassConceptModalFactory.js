const _ = require('lodash');
const Bloodhound = require('typeahead.js-browserify').Bloodhound;

module.exports = function modalFactory($uibModal) {
  'ngInject';

  return {
    open() {
      return $uibModal.open({
        template: require('./templates/searchClassConceptModal.html'),
        size: 'small',
        controller: SearchClassController,
        controllerAs: 'ctrl'
      });
    }
  };
};

function SearchClassController($modalInstance, modelLanguage, gettextCatalog) {
  'ngInject';

  const vm = this;

  vm.concept = null;
  vm.classLabel = null;

  vm.options = {
    hint: false,
    highlight: true,
    minLength: 3,
    editable: false
  };

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
    $modalInstance.close({conceptId: vm.concept.uri, classLabel: vm.classLabel});
  };

  vm.cancel = () => {
    $modalInstance.dismiss();
  };
}
