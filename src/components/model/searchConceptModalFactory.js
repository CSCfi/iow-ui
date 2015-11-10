const _ = require('lodash');
const Bloodhound = require('typeahead.js-browserify').Bloodhound;

module.exports = function modalFactory($uibModal) {
  'ngInject';

  return {
    open(references, defineConceptTitle) {
      return $uibModal.open({
        template: require('./searchConceptModal.html'),
        size: 'small',
        controller: SearchConceptController,
        controllerAs: 'ctrl',
        resolve: {
          defineConceptTitle: () => defineConceptTitle,
          references: () => references
        }
      });
    }
  };
};

function SearchConceptController($scope, $uibModalInstance, $q, languageService, gettextCatalog, defineConceptTitle, references, addConceptModal, conceptService) {
  'ngInject';

  const vm = this;

  vm.references = references;
  vm.concept = null;
  vm.label = null;
  vm.defineConceptTitle = defineConceptTitle;
  vm.normalize = normalize;

  vm.options = {
    hint: false,
    highlight: true,
    minLength: 3,
    editable: false
  };

  function normalize(concept) {
    if (concept.type === 'conceptSuggestion') {
      return {
        id: concept.id,
        label: languageService.translate(concept.label),
        comment: languageService.translate(concept.comment)
      };
    } else {
      return {
        id: concept.uri,
        label: concept.prefLabel,
        comment: concept['skos:definition'] || concept['rdfs:comment']
      };
    }
  }

  $scope.$watch('ctrl.concept', (concept) => {
    vm.normalizedConcept = concept ? normalize(concept) : null;
    vm.label = concept ? vm.normalizedConcept.label : '';
  });

  $scope.$watch('ctrl.vocabularyId', vocabularyId => {
    const searchReferences = vocabularyId ? [_.findWhere(references, {vocabularyId})] : references;
    vm.datasets = _.flatten(_.map(searchReferences, reference => createDataSets(reference)));
  });

  function identify(obj) {
    return obj.uri;
  }

  const limit = 1000;
  const estimatedDuplicateCount = 2;

  function limitResults(results) {
    return results.splice(0, Math.min(limit * estimatedDuplicateCount, results.length));
  }

  function createEngine(vocId) {
    const engine = new Bloodhound({
      identify: identify,
      remote: {
        cache: false,
        url: `/api/rest/conceptSearch?term=%QUERY&lang=${languageService.getModelLanguage()}&vocid=${vocId}`,
        wildcard: '%QUERY',
        transform: (response) => _.uniq(limitResults(response.results), identify)
      },
      rateLimitBy: 'debounce',
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      datumTokenizer: Bloodhound.tokenizers.whitespace
    });

    engine.clear();
    engine.clearPrefetchCache();
    engine.clearRemoteCache();
    engine.initialize(true);

    return engine;
  }

  function createDataSets(reference) {
    const suggestions = [];

    conceptService.getConceptSuggestions(reference.id)
      .then(fetchedSuggestions => {
        _.forEach(fetchedSuggestions, suggestion => suggestions.push(suggestion));
      });

    function suggestionContains(suggestion, query) {
      return languageService.translate(suggestion.label).toLowerCase().includes(query.toLowerCase());
    }

    function suggestionsContain(query) {
      return _.find(suggestions, suggestion => suggestionContains(suggestion, query));
    }

    function matchingSuggestions(query) {
      return _.filter(suggestions, suggestion => suggestionContains(suggestion, query));
    }

    const header = `<h5>${languageService.translate(reference.title)}</h5>`;

    const suggestionDataSet = {
      display: suggestion => languageService.translate(suggestion.label),
      name: reference.vocabularyId,
      source: (query, syncResults) => syncResults(matchingSuggestions(query)),
      limit: limit,
      templates: {
        header: header,
        empty: header,
        suggestion: (data) =>
          `
          <div>
            ${languageService.translate(data.label)} (${gettextCatalog.getString('suggestion')})
            <p class="details">${data.schemeId}</p>
          </div>
          `
      }
    };

    const dataSet = {
      display: 'prefLabel',
      name: reference.vocabularyId,
      source: createEngine(reference.vocabularyId),
      limit: limit,
      templates: {
        empty: (search) => {
          if (!suggestionsContain(search.query)) {
            return `
              <div class="empty-message">
                '${search.query}' ${gettextCatalog.getString('not found in the concept database')}
                  <p>
                    <a onClick="angular.element(jQuery('#conceptForm').parents('[uib-modal-window]')).scope().ctrl.addConcept('${search.query}', '${reference.id}')">
                      + ${gettextCatalog.getString('suggest')} '${search.query}' ${gettextCatalog.getString('and create new')}
                    </a>
                  </p>
              </div>`;
          }
        },
        suggestion: (data) =>
          `
          <div>
            ${data.prefLabel}
            <p class="details">${data.uri}</p>
          </div>
          `
      }
    };

    return [suggestionDataSet, dataSet];
  }

  vm.create = () => {
    $uibModalInstance.close({conceptId: normalize(vm.concept).id, label: vm.label});
  };

  vm.cancel = () => {
    $uibModalInstance.dismiss();
  };

  vm.addConcept = (conceptLabel, referenceId) => {
    addConceptModal.open(defineConceptTitle, conceptLabel, _.findWhere(references, {id: referenceId})).result
      .then(result => $q.all(
        {
          label: result.label,
          conceptId: conceptService.createConceptSuggestion(Object.assign(result.concept, {lang: languageService.getModelLanguage()}))
        }))
      .then(result => {
        $uibModalInstance.close(result);
      });
  };
}
