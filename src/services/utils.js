const _ = require('lodash');

function glyphIconClassForType(type) {
  return [
    'glyphicon',
    {
      'glyphicon-list-alt': type === 'class',
      'glyphicon-tasks': type === 'attribute',
      'glyphicon-sort': type === 'association',
      'glyphicon-question-sign': !type
    }
  ];
}

module.exports = {
  glyphIconClassForType
};
