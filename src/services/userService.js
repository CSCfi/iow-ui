module.exports = function userService($http, $q) {
  'ngInject';

  let loggedInUser;

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
      if(loggedInUser!=null) {
        return true;
      } else {
        return false;
      }
    },
    isInGroup(group){
      if(loggedInUser!=null && loggedInUser.isPartOf==group) {
        return true
      }
      else {
        return false
      }
    },
    logout() {
      $http.get('/api/rest/logout');
      loggedInUser = null;
    }
  };
};
