const fakeUser = {};

export default class UserService {

  loggedInUser;

  /*@ngInject*/
  constructor($http) {
    this.$http = $http;
  }

  updateLogin() {
    this.$http.get('/api/rest/loginstatus').then(statusResponse => {
      const loggedIn = angular.fromJson(statusResponse.data);
      if (loggedIn) {
        this.$http.get('/api/rest/user').then(userResponse => this.loggedInUser = angular.fromJson(userResponse.data));
      } else {
        this.loggedInUser = null;
      }
    });
  }

  fakeLogin() {
    this.loggedInUser = fakeUser;
  }

  isLoggedIn() {
    return this.loggedInUser;
  }

  logout() {
    if (this.loggedInUser !== fakeUser) {
      this.$http.get('/api/rest/logout');
    }
    this.loggedInUser = null;
  }
}
