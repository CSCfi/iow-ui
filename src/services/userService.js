const fakeUser = {};

module.exports = function userService($http) {
  'ngInject';

  let loggedInUser;

  return {
    updateLogin() {
      $http.get('/api/rest/loginstatus').then(statusResponse => {
        const loggedIn = angular.fromJson(statusResponse.data);
        if (loggedIn) {
          $http.get('/api/rest/user').then(userResponse => loggedInUser = angular.fromJson(userResponse.data));
        } else {
          loggedInUser = null;
        }
      });
    },
    fakeLogin() {
      loggedInUser = fakeUser;
    },
    isLoggedIn() {
      return loggedInUser;
    },
    logout() {
      if (loggedInUser !== fakeUser) {
        $http.get('/api/rest/logout');
      }
      loggedInUser = null;
    }
  };
};
