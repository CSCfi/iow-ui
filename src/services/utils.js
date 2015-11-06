
function ensurePropertyAsArray(obj, property) {
  const propertyValue = obj[property];

  if (!Array.isArray(propertyValue)) {
    obj[property] = propertyValue ? [propertyValue] : [];
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
};

module.exports = {
  ensurePropertyAsArray,
  glyphIconClassForType
};
