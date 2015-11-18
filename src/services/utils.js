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

function normalizeAsArray(obj) {
  return (Array.isArray(obj) ? obj : [obj]) || [];
}

module.exports = {
  glyphIconClassForType,
  normalizeAsArray
};
