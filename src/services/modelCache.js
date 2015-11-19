const _ = require('lodash');

module.exports = function modelCache() {
  'ngInject';

  let requires;

  return {
    updateRequires(updatedRequires) {
      requires = updatedRequires;
    },
    modelIdForNamespace(namespace) {
      const require = _.find(requires, req => req.namespace === namespace);
      return require && require.id;
    }
  };
};
