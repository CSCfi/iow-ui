angular.module('myApp.restapi.restapi-factory', [])

.factory('RestAPI', ['$http', function($http) {

    var urlBase = 'http://localhost:8084/IOAPI/rest/';
    var RestAPI = {};


    RestAPI.getModels = function () {
        return $http.get(urlBase + "model-data",{headers:{"Accept": "application/ld+json"}, params:{"graph":"default"}});
    };

    RestAPI.getUsers = function () {
        return $http.get(urlBase + "users",{headers:{"Accept": "application/ld+json"}});
    };
    
    RestAPI.getGroups = function () {
       return $http.get(urlBase + "groups",{headers:{"Accept": "application/ld+json"}});
    };

    RestAPI.newUser = function (name,email) {
        return $http.put(urlBase +"users", {params:{"fullName":name,"email":email}});
    };
    
    RestAPI.getUser = function (email) {
        return $http.get(urlBase + "users",{headers:{"Accept": "application/ld+json"},params:{"email":email}});
    };

    return RestAPI;
}]);