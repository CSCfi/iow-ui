module.exports = function userService($http, $q) {
  'ngInject';

  let loggedInUser = null;

  return {
    updateLogin() {
      const deferred = $q.defer();

      function userResolved() {
        deferred.resolve();
      }

      $http.get('/api/rest/loginstatus')
        .success(statusResponse => {
          const loggedIn = angular.fromJson(statusResponse);
          if (loggedIn) {
            $http.get('/api/rest/user')
              .success(userResponse => {
                loggedInUser = angular.fromJson(userResponse);
              })
              .finally(userResolved);
          } else {
            loggedInUser = null;
            userResolved();
          }
        })
        .error(userResolved);

      return deferred.promise;
    },
    getUser() {
      return loggedInUser;
    },
    isLoggedIn() {
      return loggedInUser !== null;
    },
    isInGroup(group) {
      return loggedInUser !== null && loggedInUser.isPartOf === group;
    },
    logout() {
      $http.get('/api/rest/logout');
      loggedInUser = null;
    }
  };
};
