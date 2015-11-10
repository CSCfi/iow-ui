const _ = require('lodash');

function clone(obj) {
  if (obj) {
    const cloned = Object.create(Object.getPrototypeOf(obj));
    _.merge(cloned, obj);
    return cloned;
  }
}

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
  clone,
  glyphIconClassForType
};
