module.exports = function userService($http, entities) {
  'ngInject';

  let user = entities.anonymousUser();

  function updateUser(updatedUser) {
    user = updatedUser;
  }

  return {
    updateLogin() {
      return $http.get('/api/rest/loginstatus')
        .then(statusResponse => angular.fromJson(statusResponse.data)
          ? $http.get('/api/rest/user').then(response => entities.deserializeUser(response.data))
          : entities.anonymousUser())
        .then(updateUser);
    },
    getUser() {
      return user;
    },
    isLoggedIn() {
      return user.isLoggedIn();
    },
    logout() {
      $http.get('/api/rest/logout').then(() => updateUser(entities.anonymousUser()));
    }
  };
};
