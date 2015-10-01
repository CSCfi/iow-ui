const jsonld = require('jsonld');

const frames = require('./frames');

module.exports = function classService($http) {
  'ngInject';
  return {
    getClass(id) {
      return $http.get('/api/rest/class', {params: {id}}).then(response => {
        const frame = frames.classFrame(response.data);
        return jsonld.promises.frame(response.data, frame);
      });
    }
  };
};
