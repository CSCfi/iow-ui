module.exports = function userService($http, $q) {
  'ngInject';

  let loggedInUser = null;

  return {
    updateLogin() {
      $http.get('/api/rest/loginstatus')
        .then(statusResponse => {
          if (angular.fromJson(statusResponse)) {
            return $http.get('/api/rest/user');
          } else {
            return null;
          }
        })
        .then(user => loggedInUser = user);
    },
    getUser() {
      return loggedInUser;
    },
    isLoggedIn() {
      return loggedInUser !== null;
    },
    isInGroup(group) {
      return loggedInUser && loggedInUser.isPartOf === group;
    },
    logout() {
      $http.get('/api/rest/logout')
        .then(() => loggedInUser = null);
    }
  };
};
