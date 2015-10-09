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
      }
    });
  }

  fakeLogin() {
    this.loggedInUser = {};
  }

  isLoggedIn() {
    return this.loggedInUser;
  }

  logout() {
    this.loggedInUser = null;
    this.$http.get('/api/rest/logout');
  }
}
