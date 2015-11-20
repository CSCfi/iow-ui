module.exports = function frontPageController($scope, $log, locationService, groupService) {
  'ngInject';
  const vm = this;

  locationService.atFrontPage();

  groupService.getGroups().then(groups => {
    vm.groups = groups;
  }, error => $log.error(error));

  vm.bullets = [
    { title: 'What is description?', content: 'What is description content'},
    { title: 'What is method?', content: 'What is method content'},
    { title: 'What can I do?', content: 'What can I do content'},
    { title: 'How?', content: 'How content'}
  ];

};
