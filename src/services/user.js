module.exports = function user(userService) {
  'ngInject';
  return userService.getUser();
};
