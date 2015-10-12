const fakeUser = {};

function userService($http) {
  "ngInject";
  return {
    updateLogin() {
      $http.get('/api/rest/loginstatus').then(statusResponse => {
        const loggedIn = angular.fromJson(statusResponse.data);
        if (loggedIn) {
          $http.get('/api/rest/user').then(userResponse => this.loggedInUser = angular.fromJson(userResponse.data));
        } else {
          this.loggedInUser = null;
        }
      });
    },
    fakeLogin() {
      this.loggedInUser = fakeUser;
    },
    isLoggedIn() {
      return this.loggedInUser;
    },
    logout() {
      if (this.loggedInUser !== fakeUser) {
        $http.get('/api/rest/logout');
      }
      this.loggedInUser = null;
    }
  };
}

module.exports = userService;
