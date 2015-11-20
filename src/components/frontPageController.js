const _ = require('lodash');

module.exports = function frontPageController($scope, $log, $location, locationService, groupService, searchService, languageService) {
  'ngInject';
  const vm = this;

  locationService.atFrontPage();

  vm.bullets = [
    { title: 'What is description?', content: 'What is description content'},
    { title: 'What is method?', content: 'What is method content'},
    { title: 'What can I do?', content: 'What can I do content'},
    { title: 'How?', content: 'How content'}
  ];

  groupService.getAllGroups().then(groups => {
    vm.groups = groups;
  }, error => $log.error(error));

  vm.searchResults = [];

  $scope.$watch(() => vm.searchText, search);

  function search(text) {
    if (text) {
      searchService.searchAnything(vm.searchText, languageService.getModelLanguage())
        .then(results => vm.searchResults = results);
    } else {
      vm.searchResults = [];
    }
  }

  vm.selectSearchResult = searchResult => {
    if (searchResult.iowUrl) {
      $location.url(searchResult.iowUrl);
    }
  };

  vm.selectGroup = group => $location.url(group.iowUrl);
};
